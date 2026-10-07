import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { OPTIONAL_ROOT_FILES } from '../tools/prepare-pages.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const legacy = require('../assets/js/legacy-routes.js');
const contract = JSON.parse(await fs.readFile(path.join(root, 'tests/legacy-contract.json'), 'utf8'));
const context = vm.createContext({ window: {} });
for (const file of ['assets/js/data/docs-content.js', 'assets/js/generated/docs-bodies.js']) vm.runInContext(await fs.readFile(path.join(root, file), 'utf8'), context);
const articles = new Map(context.window.COREX_DOCS.articles.map(article => [article.id, article]));

/** Check that a compatibility redirect selects a maintained article and an existing section. */
function verifyTarget(target) {
  assert.match(target, /^index\.html#\/docs\//);
  const [id, encoded] = target.replace('index.html#/docs/', '').split('~');
  assert.ok(['overview', 'instructions'].includes(id) || articles.has(id), 'Unknown legacy route: ' + target);
  if (encoded) {
    const article = articles.get(id);
    assert.ok(article, 'Section must belong to an article: ' + target);
    const anchor = decodeURIComponent(encoded);
    assert.ok(article.bodyHtml.includes('id="' + anchor + '"'), 'Lost legacy section: ' + target);
  }
}

// Expectations come from the previous website, independently of the new route map.
test('previous public pages and authored bookmarks resolve to maintained sections', async () => {
  for (const [page, anchors] of Object.entries(contract)) {
    assert.ok(OPTIONAL_ROOT_FILES.includes(page), 'Legacy entry excluded from Pages: ' + page);
    assert.ok(legacy.routes[page], 'Legacy page missing from route map: ' + page);
    const html = await fs.readFile(path.join(root, page), 'utf8');
    assert.ok(html.includes('assets/js/legacy-routes.js'), 'Legacy page lacks redirect script: ' + page);
    verifyTarget(legacy.target(page, ''));
    for (const anchor of anchors.filter(id => !['site-navigation', 'main'].includes(id))) {
      const target = legacy.target(page, '#' + anchor);
      verifyTarget(target);
      assert.ok(target.includes('~') || target !== legacy.target(page, ''), 'Bookmark silently falls back to root: ' + page + '#' + anchor);
    }
  }
});

// Navigation metadata must not retain links belonging to a different CoreX product.
test('wiki navigation and suggested article routes exist in the product catalog', () => {
  const docs = context.window.COREX_DOCS;
  for (const id of [docs.navigation.scope, docs.navigation.troubleshooting, ...(docs.hubs.instructionStarts || []), ...(docs.searchSuggestions || [])]) assert.ok(articles.has(id), 'Unknown navigation article: ' + id);
  for (const category of docs.hubs.overviewCategories) {
    for (const id of category.articles) assert.ok(articles.has('overview/' + id), 'Unknown overview card: ' + id);
  }
});
