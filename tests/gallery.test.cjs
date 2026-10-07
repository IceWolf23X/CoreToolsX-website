/* Run with: node --test tests/*.test.cjs */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const galleryPath = path.join(root, 'assets/js/core/preview-gallery.js');
function api() {
  assert.ok(fs.existsSync(galleryPath), 'Preview gallery controller must exist');
  return require(galleryPath);
}

test('empty gallery has zero slides', () => {
  assert.deepEqual(api().normalizeSlides({images: []}), []);
});
test('one image and legacy src normalize into one static slide', () => {
  assert.equal(api().normalizeSlides({images: [{src:'assets/img/one.png', alt:'One'}]}).length, 1);
  assert.equal(api().normalizeSlides({src:'assets/img/one.png', alt:'Legacy'})[0].alt, 'Legacy');
});
test('a populated gallery supersedes the legacy single source', () => {
  assert.deepEqual(api().normalizeSlides({src:'old.png', images:['one.png','two.png']}).map(x => x.src), ['one.png','two.png']);
});
test('empty entries, invalid schemes and duplicate paths cannot create self-slides', () => {
  const slides=api().normalizeSlides({images:[null,{},42,'',' ',{src:'one.png'}, {src:'./one.png'}, {src:'javascript:alert(1)'}, {src:'data:text/html,bad'}, {src:'two.png'}]});
  assert.deepEqual(slides.map(x => x.src), ['one.png','two.png']);
});
test('image caption, alt and contain/cover are data-driven', () => {
  const s=api().normalizeSlides({objectFit:'cover', images:[{src:'one.png',alt:'Description',caption:'Caption'}, {src:'two.png',objectFit:'contain'}]});
  assert.equal(s[0].objectFit, 'cover');assert.equal(s[0].caption, 'Caption');assert.equal(s[0].alt, 'Description');assert.equal(s[1].objectFit, 'contain');
});
test('invalid timer values are bounded and reduced to safe defaults', () => {
  const o=api().normalizeOptions({intervalMs:NaN,transitionMs:Infinity});
  assert.equal(o.intervalMs,5000);assert.equal(o.transitionMs,240);
  assert.equal(api().normalizeOptions({intervalMs:-1}).intervalMs,1000);
  assert.equal(api().normalizeOptions({transitionMs:0}).transitionMs,0);
});
test('gallery labels and settings remain in editable JavaScript data', () => {
  assert.match(fs.readFileSync(path.join(root,'assets/js/data/ui-text.js'),'utf8'), /gallery\s*:/);
  assert.match(fs.readFileSync(path.join(root,'assets/js/data/site-config.js'),'utf8'), /images\s*:/);
  assert.match(fs.readFileSync(path.join(root,'index.html'),'utf8'), /assets\/js\/core\/preview-gallery.js/);
});
// Verify practical setup against the manifest-driven workflow rather than a product-specific notifier.
test('SETUP documents local defaults, optional private synchronization and gallery settings', async () => {
  const { SOURCE_REF, SOURCE_REPOSITORY } = await import('../tools/config-sync-map.mjs');
  const guide = fs.readFileSync(path.join(root, 'SETUP.md'), 'utf8');
  for (const needle of ['COREX_PLUGIN_READ_TOKEN', 'heroPreview', 'images', 'build-config-bundle.mjs', 'index.html', SOURCE_REF, SOURCE_REPOSITORY]) assert.ok(guide.includes(needle), 'Guide must mention ' + needle);
  const sync = fs.readFileSync(path.join(root, '.github/workflows/sync-plugin-configs.yml'), 'utf8');
  assert.ok(sync.includes("import { SOURCE_REPOSITORY, SOURCE_REF } from './tools/config-sync-map.mjs'"), 'Workflow must read the shared source manifest');
  assert.ok(sync.includes('ref: ${{ steps.source.outputs.ref }}'), 'Checkout must use the mapped source branch');
  assert.ok(sync.includes("if: steps.source.outputs.enabled == 'true'"), 'Private checkout must remain conditional on credential availability');
});
