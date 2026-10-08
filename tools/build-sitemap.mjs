/** Generate canonical sitemap URLs and a robots reference without indexing hash routes or redirects. */
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';

/** Escape canonical URLs for their XML text nodes. */
function xml(value) { return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;'); }

/** Build only configured maintained entrypoints and preserve existing robots directives. */
export async function buildSitemap(root, { check = false } = {}) {
  root = path.resolve(root);
  const context = vm.createContext({ window: {} });
  vm.runInContext(await fs.readFile(path.join(root, 'assets/js/data/site-config.js'), 'utf8'), context, { timeout: 1000 });
  const site = context.window.COREX_SITE;
  const official = new URL(site.links.official);
  if (official.protocol !== 'https:' || official.username || official.password || official.search || official.hash || !official.pathname.endsWith('/')) throw new Error('Invalid sitemap website origin.');
  const config = JSON.parse(await fs.readFile(path.join(root, 'assets/content/seo.json'), 'utf8'));
  if (config.schemaVersion !== 1 || !Array.isArray(config.pages) || !config.pages.length) throw new Error('Missing canonical sitemap page list.');
  const seen = new Set(), urls = [];
  for (const page of config.pages) {
    if (typeof page.path !== 'string' || page.path && !/^[a-z0-9-]+\.html$/.test(page.path)) throw new Error('Sitemap paths must be real top-level pages without fragments or queries.');
    const file = page.path || 'index.html';
    const stat = await fs.lstat(path.join(root, file));
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Sitemap page is missing or not a regular file: ' + file);
    const url = new URL(page.path, official).href;
    if (seen.has(url)) throw new Error('Duplicate canonical sitemap URL: ' + url);
    seen.add(url); urls.push(url);
  }
  const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map(url => '  <url><loc>' + xml(url) + '</loc></url>').join('\n') + '\n</urlset>\n';
  const robotsPath = path.join(root, 'robots.txt');
  let robotsSource;
  try { robotsSource = await fs.readFile(robotsPath, 'utf8'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; robotsSource = 'User-agent: *\nAllow: /\n'; }
  const directives = robotsSource.replace(/\r\n/g, '\n').split('\n').filter(line => !/^\s*Sitemap\s*:/i.test(line)).join('\n').trimEnd();
  const robots = directives + '\n\nSitemap: ' + new URL('sitemap.xml', official).href + '\n';
  const outputs = [[path.join(root, 'sitemap.xml'), sitemap], [robotsPath, robots]];
  let changed = 0;
  for (const [file, content] of outputs) {
    const stat = await fs.lstat(file).catch(error => { if (error.code !== 'ENOENT') throw error; return null; });
    if (stat?.isSymbolicLink()) throw new Error('Refusing symbolic link SEO output: ' + file);
    const existing = stat ? await fs.readFile(file, 'utf8') : null;
    if (existing !== content) changed++;
    if (check && existing !== content) throw new Error('Sitemap/robots files are stale; run node tools/build-sitemap.mjs .');
  }
  if (!check) for (const [file, content] of outputs) await fs.writeFile(file, content, 'utf8');
  return { count: urls.length, changed };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try { const result = await buildSitemap(process.argv[2] || '.', { check: process.argv.includes('--check') }); console.log((process.argv.includes('--check') ? 'Checked' : 'Built') + ' sitemap: ' + result.count + ' canonical pages.'); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
