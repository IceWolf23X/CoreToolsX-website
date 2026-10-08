/** Generate a readable standalone privacy notice from public product settings and editable JSON content. */
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';

/** Escape authored text before placing it in static HTML. */
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

/** Reject insecure or credential-bearing provider links in the legal document. */
function providerLink(link) {
  const url = new URL(link.url);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Provider links must use public HTTPS URLs.');
  return '<a href="' + escapeHTML(url.href) + '" rel="noopener noreferrer">' + escapeHTML(link.label) + '</a>';
}

/** Load only the declared public data sources used to generate the notice. */
async function inputs(root) {
  const context = vm.createContext({ window: {} });
  for (const file of ['assets/js/data/site-config.js', 'assets/js/data/ui-text.js']) {
    const target = path.join(root, file);
    if ((await fs.lstat(target)).isSymbolicLink()) throw new Error('Refusing symbolic link input: ' + file);
    vm.runInContext(await fs.readFile(target, 'utf8'), context, { filename: file, timeout: 1000 });
  }
  const source = path.join(root, 'assets/content/privacy.json');
  if ((await fs.lstat(source)).isSymbolicLink()) throw new Error('Refusing symbolic link privacy content.');
  return { site: context.window.COREX_SITE, ui: context.window.COREX_UI, policy: JSON.parse(await fs.readFile(source, 'utf8')) };
}

/** Build stable UTF-8 HTML, or fail without overwriting the notice when check mode finds stale output. */
export async function buildPrivacyPage(root, { check = false } = {}) {
  root = path.resolve(root);
  const { site, ui, policy } = await inputs(root);
  const official = new URL(site.links.official);
  if (official.protocol !== 'https:' || official.username || official.password || official.search || official.hash || !official.pathname.endsWith('/')) throw new Error('Invalid official website URL.');
  if (!site.brand.product || ui.legal?.href !== 'privacy.html' || !ui.legal.label) throw new Error('Missing public privacy link settings.');
  if (policy.schemaVersion !== 1 || !policy.controller?.name?.trim() || !/^[^\s<>"'@]+@[^\s<>"'@]+\.[^\s<>"'@]+$/.test(policy.controller.email || '')) throw new Error('A real controller name and contact email are required.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(policy.updated) || Number.isNaN(Date.parse(policy.updated + 'T00:00:00Z'))) throw new Error('Invalid notice update date.');
  if (!Array.isArray(policy.sections) || !policy.sections.length || new Set(policy.sections.map(section => section.id)).size !== policy.sections.length) throw new Error('Privacy sections must have unique identifiers.');
  const cacheMinutes = Number.isFinite(site.releases.cacheMinutes) ? Math.max(0, Math.min(1440, site.releases.cacheMinutes)) : 15;
  const values = { product: site.brand.product, siteUrl: official.href, themeKey: site.theme.storageKey, releaseCacheKey: 'corex.github-releases.v2:' + (site.releases.owner + '/' + site.releases.repository).toLowerCase(), cacheMinutes };
  /** Resolve known data tokens and reject incomplete or mistyped placeholders. */
  function text(value) {
    if (typeof value !== 'string') throw new Error('Privacy text must be a string.');
    return escapeHTML(value.replace(/\{\{([^}]+)\}\}/g, (token, name) => {
      if (!(name in values)) throw new Error('Unknown privacy token: ' + name);
      return String(values[name]);
    }));
  }
  /** Render the actual functional-storage keys without inventing a deletion deadline. */
  function storageTable() {
    return '<div class="table-scroll" role="region" aria-label="Functional browser storage" tabindex="0"><table><thead><tr><th>Storage</th><th>Purpose</th><th>Persistence</th></tr></thead><tbody>' +
      '<tr><td><code>' + text(values.themeKey) + '</code><br>Local storage</td><td>Your selected light or dark appearance.</td><td>Until changed or cleared in this browser.</td></tr>' +
      '<tr><td><code>' + text(values.releaseCacheKey) + '</code><br>Local storage</td><td>Public GitHub release metadata and request retry status.</td><td>Reused for up to ' + cacheMinutes + ' minutes before refresh. The saved record remains until replaced or cleared; it is not automatically deleted at that interval.</td></tr>' +
      '</tbody></table></div>';
  }
  let storageSections = 0;
  // Render authored prose as text, reserving HTML structure for the generator.
  const sections = policy.sections.map(section => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(section.id)) throw new Error('Invalid privacy section identifier.');
    const paragraphs = (section.paragraphs || []).map(paragraph => '<p>' + text(paragraph) + '</p>').join('\n');
    const bullets = section.bullets?.length ? '<ul>' + section.bullets.map(bullet => '<li>' + text(bullet) + '</li>').join('') + '</ul>' : '';
    const storage = section.storageTable ? (storageSections++, storageTable()) : '';
    const links = section.links?.length ? '<div class="legal-provider-links">' + section.links.map(providerLink).join('') + '</div>' : '';
    return '<section class="legal-section" id="' + section.id + '"><h2>' + text(section.title) + '</h2>\n' + paragraphs + bullets + storage + links + '</section>';
  }).join('\n');
  if (storageSections !== 1) throw new Error('The notice must contain exactly one functional-storage table.');
  const title = site.brand.product + ' — ' + policy.title;
  const date = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(policy.updated + 'T00:00:00Z'));
  const logo = site.brand.logo;
  if (!/^assets\/[A-Za-z0-9._/-]+$/.test(logo) || logo.split('/').includes('..')) throw new Error('Privacy logo must be a local public asset.');
  const product = site.brand.product;
  const brand = product.endsWith('X') ? escapeHTML(product.slice(0, -1)) + '<span class="brand-x">X</span>' : escapeHTML(product);
  const canonical = new URL('privacy.html', official).href;
  const navigation = policy.sections.map(section => '<a href="#' + section.id + '">' + text(section.title) + '</a>').join('\n');
  const sources = policy.sources.map(providerLink).join('\n');
  const html = '<!doctype html>\n<!-- Generated by tools/build-privacy-page.mjs from assets/content/privacy.json. -->\n' +
    '<html lang="' + escapeHTML(site.brand.language || 'en') + '" data-theme="light" data-static-meta>\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>' + escapeHTML(title) + '</title>\n<meta name="description" content="' + text(policy.summary) + '">\n<link rel="canonical" href="' + escapeHTML(canonical) + '">\n' +
    '<link id="site-favicon" rel="icon" type="image/png" href="' + escapeHTML(site.brand.favicon) + '">\n' +
    '<link rel="stylesheet" href="assets/css/tokens.css">\n<link rel="stylesheet" href="assets/css/base.css">\n<link rel="stylesheet" href="assets/css/docs.css">\n<link rel="stylesheet" href="assets/css/legal.css">\n' +
    '<script src="assets/js/data/site-config.js"></script>\n<script src="assets/js/boot.js"></script>\n<script src="assets/js/core/legal-page.js" defer></script>\n</head>\n<body class="legal-page">\n' +
    '<a class="skip-link" href="#privacy-main">Skip to privacy notice</a>\n<header class="site-header"><div class="header-inner"><a class="brand" href="index.html" aria-label="' + escapeHTML(product) + ' home"><img src="' + escapeHTML(logo) + '" alt="" width="28" height="28"><span>' + brand + '</span></a><div class="header-actions"><a class="button ghost small" href="index.html">Back to site</a><button class="button small" type="button" data-legal-theme-toggle data-to-light="' + escapeHTML(ui.theme.toLight) + '" data-to-dark="' + escapeHTML(ui.theme.toDark) + '" hidden>Theme</button></div></div></header>\n' +
    '<main class="container prose legal-main" id="privacy-main"><header class="legal-title"><p class="eyebrow">' + escapeHTML(product) + '</p><h1>' + text(policy.title) + '</h1><p class="legal-meta">Last updated: <time datetime="' + policy.updated + '">' + date + '</time></p></header>\n' +
    '<div class="legal-summary"><p>' + text(policy.summary) + '</p></div><dl class="legal-controller"><dt>Data controller</dt><dd>' + escapeHTML(policy.controller.name) + '</dd><dt>Privacy contact</dt><dd><a href="mailto:' + escapeHTML(policy.controller.email) + '">' + escapeHTML(policy.controller.email) + '</a></dd></dl>\n' +
    '<nav class="legal-toc" aria-label="On this page">' + navigation + '</nav>\n' + sections + '\n' +
    '<section class="legal-section" id="provider-notices"><h2>Provider notices and references</h2><div class="legal-provider-links">' + sources + '</div></section>\n</main>\n' +
    '<footer class="site-footer"><div class="container legal-footer-links"><a href="index.html">' + escapeHTML(product) + ' home</a><a href="reference.html">Documentation reference</a><a href="privacy.html" aria-current="page">' + escapeHTML(ui.legal.label) + '</a></div></footer>\n</body>\n</html>\n';
  const output = path.join(root, 'privacy.html');
  const stat = await fs.lstat(output).catch(error => { if (error.code !== 'ENOENT') throw error; return null; });
  if (stat?.isSymbolicLink()) throw new Error('Refusing symbolic link privacy output.');
  const previous = stat ? await fs.readFile(output, 'utf8') : null;
  if (check && previous !== html) throw new Error('Privacy page is stale; run node tools/build-privacy-page.mjs .');
  if (!check && previous !== html) await fs.writeFile(output, html, 'utf8');
  return { changed: previous !== html, path: output };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try { const result = await buildPrivacyPage(process.argv[2] || '.', { check: process.argv.includes('--check') }); console.log((process.argv.includes('--check') ? 'Checked' : result.changed ? 'Updated' : 'Unchanged') + ' privacy page: ' + result.path); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
