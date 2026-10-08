/** Generate initial HTML search metadata from editable public site data, preserving the application shell. */
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';

/** Escape public text and canonical URLs for HTML content and attribute values. */
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[character]);
}

/** Check or update maintained HTML shells without modifying article bodies or runtime scripts. */
export async function buildPageMeta(root, {check = false} = {}) {
  root = path.resolve(root);
  const context = vm.createContext({window:{}});
  vm.runInContext(await fs.readFile(path.join(root, 'assets/js/data/site-config.js'), 'utf8'), context, {timeout:1000});
  const site = context.window.COREX_SITE;
  const official = new URL(site.links.official);
  if (official.protocol !== 'https:' || official.username || official.password || official.search || official.hash || !official.pathname.endsWith('/')) throw new Error('Invalid metadata website URL.');
  const config = JSON.parse(await fs.readFile(path.join(root, 'assets/content/seo.json'), 'utf8'));
  if (config.schemaVersion !== 1 || !Array.isArray(config.pages)) throw new Error('Missing public SEO page inventory.');
  const values = {product:site.brand.product, tagline:site.brand.tagline, description:site.brand.description};
  /** Resolve known public identity fields and fail on an incomplete authoring template. */
  function resolve(value) {
    if (typeof value !== 'string' || !value.trim()) throw new Error('Metadata text is required.');
    return escapeHTML(value.replace(/\{\{([^}]+)\}\}/g, (token, key) => {
      if (!(key in values) || !values[key]) throw new Error('Unknown or missing SEO token: ' + key);
      return values[key];
    }));
  }
  const outputs = [], seen = new Set();
  for (const page of config.pages) {
    if (!page.title && !page.description) continue; // The standalone privacy builder owns its own metadata.
    if (!['', 'reference.html'].includes(page.path) || seen.has(page.path)) throw new Error('Metadata can target each maintained application shell only once.');
    seen.add(page.path);
    const file = path.join(root, page.path || 'index.html');
    if ((await fs.lstat(file)).isSymbolicLink()) throw new Error('Refusing symbolic link metadata output.');
    const previous = await fs.readFile(file, 'utf8'), newline = previous.includes('\r\n') ? '\r\n' : '\n';
    let html = previous.replace(/\r\n/g, '\n');
    if (!/<head\b[^>]*>/i.test(html) || !/<\/head>/i.test(html)) throw new Error('Metadata requires a real HTML head.');
    html = html.replace(/<!-- COREX_SEO_START -->[\s\S]*?<!-- COREX_SEO_END -->\n?/g, '');
    html = html.replace(/<title\b[^>]*>[\s\S]*?<\/title>\n?/gi, '');
    html = html.replace(/<meta\b[^>]*\bname\s*=\s*(["'])description\1[^>]*>\n?/gi, '');
    html = html.replace(/<link\b[^>]*\brel\s*=\s*(["'])canonical\1[^>]*>\n?/gi, '');
    html = html.replace(/<html\b([^>]*)>/i, (tag, attributes) => attributes.includes('data-static-meta') ? tag : '<html' + attributes + ' data-static-meta>');
    const block = '<!-- COREX_SEO_START -->\n<title>' + resolve(page.title) + '</title>\n<meta name="description" content="' + resolve(page.description) + '">\n<link rel="canonical" href="' + escapeHTML(new URL(page.path, official).href) + '">\n<!-- COREX_SEO_END -->\n';
    html = html.replace(/<\/head>/i, block + '</head>').replace(/\n/g, newline);
    if (check && html !== previous) throw new Error('Page metadata is stale; run node tools/build-page-meta.mjs .');
    outputs.push({file, html, previous});
  }
  if (seen.size !== 2) throw new Error('Home and full reference both need authored metadata settings.');
  if (!check) for (const output of outputs) if (output.html !== output.previous) await fs.writeFile(output.file, output.html, 'utf8');
  return {count:outputs.length, changed:outputs.filter(output => output.html !== output.previous).length};
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try { const result = await buildPageMeta(process.argv[2] || '.', {check:process.argv.includes('--check')}); console.log((process.argv.includes('--check') ? 'Checked' : 'Built') + ' search metadata: ' + result.count + ' pages.'); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
