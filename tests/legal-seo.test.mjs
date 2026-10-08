import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { buildPrivacyPage } from '../tools/build-privacy-page.mjs';
import { buildSitemap } from '../tools/build-sitemap.mjs';
import { buildPageMeta } from '../tools/build-page-meta.mjs';
import { preparePages } from '../tools/prepare-pages.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Prepare independent public inputs and register cleanup within the test-owned temporary root. */
async function fixture(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'corex-legal-'));
  // Cleanup owns only the directory returned by mkdtemp for this fixture.
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  for (const folder of ['assets/content', 'assets/js/data', 'synced-configs']) await fs.mkdir(path.join(dir, folder), { recursive: true });
  for (const file of ['assets/content/privacy.json', 'assets/content/seo.json', 'assets/js/data/site-config.js', 'assets/js/data/ui-text.js']) await fs.copyFile(path.join(root, file), path.join(dir, file));
  await fs.writeFile(path.join(dir, 'index.html'), '<html><head><title>Old generic</title></head><body><h1>Home</h1></body></html>');
  await fs.writeFile(path.join(dir, 'reference.html'), '<html><head></head><body><h1>Reference</h1></body></html>');
  await buildPageMeta(dir);
  return dir;
}

/** Replace an authored fixture value without deriving test expectations from the generator. */
async function editJSON(dir, file, transform) {
  const target = path.join(dir, file);
  const value = JSON.parse(await fs.readFile(target, 'utf8'));
  transform(value);
  await fs.writeFile(target, JSON.stringify(value));
}

/** Read the public settings in the same isolated environment as browser data files. */
async function settings(dir) {
  const context = vm.createContext({ window: {} });
  vm.runInContext(await fs.readFile(path.join(dir, 'assets/js/data/site-config.js'), 'utf8'), context);
  return context.window.COREX_SITE;
}

// The notice must expose controller and real storage persistence without relying on client rendering.
test('static notice includes controller, real keys, canonical and clear persistence', async t => {
  const dir = await fixture(t), site = await settings(dir);
  await buildPrivacyPage(dir);
  const html = await fs.readFile(path.join(dir, 'privacy.html'), 'utf8');
  const policy = JSON.parse(await fs.readFile(path.join(dir, 'assets/content/privacy.json'), 'utf8'));
  assert.ok(html.includes(policy.controller.name));
  assert.ok(html.includes('mailto:' + policy.controller.email));
  assert.ok(html.includes('<!--email_off--><a href="mailto:' + policy.controller.email + '">'), 'Public privacy contact must remain readable when provider email obfuscation is enabled');
  assert.ok(html.includes(site.theme.storageKey));
  assert.ok(html.includes('corex.github-releases.v2:' + (site.releases.owner + '/' + site.releases.repository).toLowerCase()));
  assert.match(html, /not automatically deleted/);
  assert.match(html, /Until changed or cleared/);
  assert.ok(html.includes(new URL('privacy.html', site.links.official).href));
  assert.match(html, /<main[^>]+id="privacy-main"/);
  assert.doesNotMatch(html, /\{\{|fetch\(|github-releases\.js|<script[^>]+src="https:/);
  await buildPrivacyPage(dir, { check: true });
});

// Authored content is prose data, never executable markup.
test('notice escapes authored markup and rejects insecure provider links or unknown tokens', async t => {
  const dir = await fixture(t);
  await editJSON(dir, 'assets/content/privacy.json', policy => { policy.sections[0].paragraphs.push('<img src=x onerror=alert(1)> & text'); });
  await buildPrivacyPage(dir);
  const html = await fs.readFile(path.join(dir, 'privacy.html'), 'utf8');
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt; &amp; text/);
  assert.doesNotMatch(html, /<img src=x/);
  await editJSON(dir, 'assets/content/privacy.json', policy => { policy.sources[0].url = 'javascript:alert(1)'; });
  await assert.rejects(buildPrivacyPage(dir), /HTTPS/);
  await editJSON(dir, 'assets/content/privacy.json', policy => { policy.sources[0].url = 'https://example.test/'; policy.summary = '{{missingToken}}'; });
  await assert.rejects(buildPrivacyPage(dir), /Unknown privacy token/);
});

// Freshness validation must not destroy a previously good reviewable notice or Pages artifact.
test('stale legal preflight preserves notice and previous packaged website', async t => {
  const dir = await fixture(t);
  await buildPrivacyPage(dir); await buildSitemap(dir);
  const before = await fs.readFile(path.join(dir, 'privacy.html'), 'utf8');
  await preparePages(dir);
  await fs.writeFile(path.join(dir, '_site/keep'), 'good website');
  await editJSON(dir, 'assets/content/privacy.json', policy => { policy.summary += ' Revised text.'; });
  await assert.rejects(buildPrivacyPage(dir, { check: true }), /stale/);
  await assert.rejects(preparePages(dir), /stale/);
  assert.equal(await fs.readFile(path.join(dir, 'privacy.html'), 'utf8'), before);
  assert.equal(await fs.readFile(path.join(dir, '_site/keep'), 'utf8'), 'good website');
});

// Sitemap discovery uses real canonical pages and retains pre-existing crawler instructions.
test('sitemap lists three absolute canonical pages and preserves robots directives', async t => {
  const dir = await fixture(t), site = await settings(dir);
  await buildPrivacyPage(dir);
  await fs.writeFile(path.join(dir, 'robots.txt'), 'User-agent: *\nDisallow: /internal/\n# Keep this policy\nSitemap: https://old.example/sitemap.xml\n');
  const result = await buildSitemap(dir);
  assert.equal(result.count, 3);
  const xml = await fs.readFile(path.join(dir, 'sitemap.xml'), 'utf8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  assert.deepEqual(locs, ['', 'reference.html', 'privacy.html'].map(page => new URL(page, site.links.official).href));
  assert.match(xml, /xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9"/);
  assert.doesNotMatch(xml, /<lastmod>|#\/|index.html|features.html/);
  const robots = await fs.readFile(path.join(dir, 'robots.txt'), 'utf8');
  assert.match(robots, /Disallow: \/internal\/\n# Keep this policy/);
  assert.equal((robots.match(/Sitemap:/g) || []).length, 1);
  assert.ok(robots.includes('Sitemap: ' + new URL('sitemap.xml', site.links.official).href));
  assert.equal((await buildSitemap(dir, { check: true })).changed, 0);
});

// Route fragments, escaping paths and duplicate entries must fail instead of entering a crawler file.
test('sitemap rejects fragments, queries, traversal, duplicate and missing pages', async t => {
  const dir = await fixture(t);
  await buildPrivacyPage(dir);
  for (const invalid of ['#/docs/overview', 'reference.html?view=1', '../index.html', 'missing.html']) {
    await editJSON(dir, 'assets/content/seo.json', seo => { seo.pages = [{ path: invalid }]; });
    await assert.rejects(buildSitemap(dir));
  }
  await editJSON(dir, 'assets/content/seo.json', seo => { seo.pages = [{ path: '' }, { path: '' }]; });
  await assert.rejects(buildSitemap(dir), /Duplicate/);
});

// A stale crawler file must never be silently overwritten during a read-only check or package preflight.
test('sitemap check preserves stale files and blocks packaging', async t => {
  const dir = await fixture(t);
  await buildPrivacyPage(dir); await buildSitemap(dir);
  await fs.writeFile(path.join(dir, 'sitemap.xml'), 'stale inventory');
  await assert.rejects(buildSitemap(dir, { check: true }), /stale/);
  await assert.rejects(preparePages(dir), /stale/);
  assert.equal(await fs.readFile(path.join(dir, 'sitemap.xml'), 'utf8'), 'stale inventory');
});

// All generated public entrypoints need to survive the same allow-listed publication pipeline.
test('Pages includes the static notice, sitemap and robots', async t => {
  const dir = await fixture(t);
  await buildPrivacyPage(dir); await buildSitemap(dir);
  const output = await preparePages(dir);
  for (const file of ['privacy.html', 'sitemap.xml', 'robots.txt']) assert.equal(await fs.readFile(path.join(output, file), 'utf8'), await fs.readFile(path.join(dir, file), 'utf8'));
  assert.equal(await fs.access(path.join(output, 'tools')).then(() => true, () => false), false);
});

// Generated committed outputs must stay fresh when any input source changes.
test('checkout notice and sitemap are fresh', async () => {
  await buildPrivacyPage(root, { check: true });
  await buildSitemap(root, { check: true });
});

// Initial HTML needs product-specific text even when a crawler does not execute the application.
test('initial search metadata is specific, canonical and idempotent', async t => {
  const dir = await fixture(t), site = await settings(dir);
  for (const file of ['index.html','reference.html']) {
    const html = await fs.readFile(path.join(dir,file),'utf8');
    assert.ok(html.includes(site.brand.product));
    assert.match(html, /data-static-meta/);
    assert.equal((html.match(/<title>/g)||[]).length,1);
    assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
    assert.ok(html.includes(new URL(file==='index.html'?'':file,site.links.official).href));
    assert.doesNotMatch(html, /Old generic|\{\{/);
  }
  assert.equal((await buildPageMeta(dir, {check:true})).changed,0);
  await buildPageMeta(root, {check:true});
});

// Updating public identity must make metadata stale without overwriting the reviewable old shell.
test('stale search metadata blocks packaging and preserves the HTML shell', async t => {
  const dir = await fixture(t);
  await buildPrivacyPage(dir); await buildSitemap(dir);
  const before = await fs.readFile(path.join(dir,'index.html'),'utf8');
  await editJSON(dir,'assets/content/seo.json',seo => {seo.pages[0].title += ' New title';});
  await assert.rejects(buildPageMeta(dir,{check:true}),/stale/);
  await assert.rejects(preparePages(dir),/stale/);
  assert.equal(await fs.readFile(path.join(dir,'index.html'),'utf8'),before);
});
