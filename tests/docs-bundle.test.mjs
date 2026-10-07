import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const builder = path.join(root, 'tools/build-docs-bundle.mjs');
const catalogPath = 'assets/js/data/docs-content.js';
const bundlePath = 'assets/js/generated/docs-bodies.js';
const bodyPath = 'assets/content/docs/overview/example.html';
const body = '<h2 id="literal">Literal content</h2>\n<pre><code>`backticks` ${value} \\ "quotes" &amp; Î•Î»Î»Î·Î½Î¹ÎºÎ¬</code></pre>\n<script>window.example = "preserved";</script>\n';

// Create independent HTML authoring inputs without using the compiler to derive expectations.
async function fixture(t, articles = [{ id: 'overview/example', bodyFile: bodyPath }]) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'corex-docs-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  await fs.mkdir(path.join(dir, 'assets/js/data'), { recursive: true });
  await fs.mkdir(path.join(dir, 'assets/content/docs/overview'), { recursive: true });
  await fs.writeFile(path.join(dir, catalogPath), 'window.COREX_DOCS = ' + JSON.stringify({ articles }) + ';\n');
  await fs.writeFile(path.join(dir, bodyPath), body);
  return dir;
}

// Invoke the actual CLI to check success, validation failures and read-only check mode.
function build(dir, ...args) {
  return spawnSync(process.execPath, [builder, dir, ...args], { encoding: 'utf8' });
}

// An offline consumer must receive HTML exactly, including characters awkward in JS strings.
test('per-page HTML is available to the offline consumer without fetch', async t => {
  const dir = await fixture(t);
  const result = build(dir);
  assert.equal(result.status, 0, result.stderr);
  const context = vm.createContext({ window: {} });
  for (const file of [catalogPath, bundlePath]) {
    vm.runInContext(await fs.readFile(path.join(dir, file), 'utf8'), context, { filename: file });
  }
  assert.equal(context.window.COREX_DOCS.articles[0].bodyHtml, body);
  assert.equal(context.window.example, undefined, 'HTML must remain data rather than execute as JavaScript');
  const original = await fs.readFile(path.join(dir, bundlePath), 'utf8');
  assert.equal(build(dir, '--check').status, 0);
  assert.equal(build(dir).status, 0);
  assert.equal(await fs.readFile(path.join(dir, bundlePath), 'utf8'), original);
});

// Directory pages may intentionally have no authored body because their links render dynamically.
test('an empty authored body remains available for generated directory pages', async t => {
  const dir = await fixture(t);
  await fs.writeFile(path.join(dir, bodyPath), '');
  const result = build(dir);
  assert.equal(result.status, 0, result.stderr);
  const context = vm.createContext({ window: {} });
  for (const file of [catalogPath, bundlePath]) {
    vm.runInContext(await fs.readFile(path.join(dir, file), 'utf8'), context);
  }
  assert.equal(context.window.COREX_DOCS.articles[0].bodyHtml, '');
});

// Stale snapshots must be detected without silently overwriting the editor's local bundle.
test('check mode rejects edited HTML while preserving the previous bundle', async t => {
  const dir = await fixture(t);
  assert.equal(build(dir).status, 0);
  const original = await fs.readFile(path.join(dir, bundlePath), 'utf8');
  await fs.writeFile(path.join(dir, bodyPath), '<p>Edited article</p>\n');
  const result = build(dir, '--check');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /stale|rebuild/i);
  assert.equal(await fs.readFile(path.join(dir, bundlePath), 'utf8'), original);
});

// Missing bodies and duplicate routes must never replace a previously usable offline snapshot.
test('invalid catalogs preserve the previous offline bundle', async t => {
  const dir = await fixture(t);
  assert.equal(build(dir).status, 0);
  const original = await fs.readFile(path.join(dir, bundlePath), 'utf8');
  await fs.unlink(path.join(dir, bodyPath));
  assert.notEqual(build(dir).status, 0);
  assert.equal(await fs.readFile(path.join(dir, bundlePath), 'utf8'), original);
  await fs.writeFile(path.join(dir, bodyPath), body);
  await fs.writeFile(path.join(dir, catalogPath), 'window.COREX_DOCS = {articles:[{id:"overview/example",bodyFile:"' + bodyPath + '"},{id:"overview/example",bodyFile:"' + bodyPath + '"}]};');
  const result = build(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /duplicate/i);
  assert.equal(await fs.readFile(path.join(dir, bundlePath), 'utf8'), original);
});

// A mistaken catalog path must not import a file outside the per-page content directory.
test('catalog paths cannot read outside their matching article directory', async t => {
  const dir = await fixture(t, [{ id: 'overview/example', bodyFile: '../../private.html' }]);
  const result = build(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /bodyFile|path/i);
  await assert.rejects(fs.access(path.join(dir, bundlePath)));
});

// Both browser shells must hydrate every routed article before their renderers run.
test('wiki and full reference receive the same complete offline article bodies', async () => {
  for (const entry of ['index.html', 'reference.html']) {
    const html = await fs.readFile(path.join(root, entry), 'utf8');
    const context = vm.createContext({ window: {} });
    let consumers = 0;
    for (const match of html.matchAll(/<script\b[^>]*src="([^"]+)"/g)) {
      if ([catalogPath, bundlePath].includes(match[1])) {
        vm.runInContext(await fs.readFile(path.join(root, match[1]), 'utf8'), context);
      } else if (['assets/js/docs.js', 'assets/js/core/reference-renderer.js'].includes(match[1])) {
        consumers++;
        const docs = context.window.COREX_DOCS;
        assert.equal(docs.articles.length, docs.meta.articleCount);
        for (const article of docs.articles) {
          assert.equal(typeof article.bodyFile, 'string', entry + ': no per-page source for ' + article.id);
          assert.equal(article.bodyHtml, await fs.readFile(path.join(root, article.bodyFile), 'utf8'), entry + ': ' + article.id);
        }
      }
    }
    assert.equal(consumers, 1, entry + ': documentation consumer missing');
  }
});
