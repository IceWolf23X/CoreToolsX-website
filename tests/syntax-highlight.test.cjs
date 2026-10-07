const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

// Load a fresh browser-style runtime with the real vendored grammars for each test.
function environment(withLibrary = true) {
  const controller = path.join(root, 'assets/js/core/syntax-highlight.js');
  assert.ok(fs.existsSync(controller), 'Syntax highlighting controller must exist');
  const context = vm.createContext({});
  context.window = context;
  if (withLibrary) {
    for (const file of ['assets/vendor/highlightjs/highlight.min.js', 'assets/vendor/highlightjs/languages/properties.min.js']) {
      vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
    }
  }
  vm.runInContext(fs.readFileSync(controller, 'utf8'), context);
  return context;
}

// Model the small code-element interface used by the rendering adapter.
function code(source, language) {
  return {
    textContent: source,
    innerHTML: source,
    className: 'language-' + language,
    dataset: {},
    classList: {
      // Record the generated highlighter marker without interpreting source HTML.
      add(name) { this.added = name; }
    }
  };
}

// Expose a supplied set of preformatted blocks as a newly rendered article.
function article(blocks) {
  return { querySelectorAll() { return blocks; } };
}

// YAML keys, comments and literal values should receive tokens while HTML stays escaped.
test('YAML highlighting colors meaningful tokens and escapes source HTML', () => {
  const context = environment();
  const source = '# configuration\nchat:\n  enabled: false\n  name: "<img src=x onerror=alert(1)>"\n';
  const element = code(source, 'yml');
  context.COREX_HIGHLIGHT.render(article([element]));
  assert.match(element.innerHTML, /class="hljs-attr"/);
  assert.match(element.innerHTML, /class="hljs-comment"/);
  assert.match(element.innerHTML, /class="hljs-literal"/);
  assert.match(element.innerHTML, /&lt;img/);
  assert.doesNotMatch(element.innerHTML, /<img/);
  assert.equal(element.dataset.highlighted, 'yes');
});

// Velocity's separately registered properties grammar must support dotted keys.
test('properties highlighting uses the explicit properties grammar', () => {
  const context = environment();
  const element = code('# proxy\nhooks.premiumvanish=true\nnetwork-channel=corechatx:main\n', 'properties');
  context.COREX_HIGHLIGHT.render(article([element]));
  assert.match(element.innerHTML, /class="hljs-attr"/);
  assert.match(element.innerHTML, /class="hljs-comment"/);
  assert.equal(element.dataset.highlighted, 'yes');
});

// Unknown labels and plain text must retain their original presentation.
test('plain text and unknown languages are not autodetected', () => {
  const context = environment();
  const plain = code('enabled: true', 'text');
  const unknown = code('enabled: true', 'not-a-language');
  context.COREX_HIGHLIGHT.render(article([plain, unknown]));
  assert.equal(plain.innerHTML, 'enabled: true');
  assert.equal(unknown.innerHTML, 'enabled: true');
  assert.equal(plain.dataset.highlighted, undefined);
  assert.equal(unknown.dataset.highlighted, undefined);
});

// Re-entering an article must not nest tokens, and newly inserted blocks must work.
test('highlighting is idempotent and handles later article blocks', () => {
  const context = environment();
  const first = code('enabled: true\n', 'yaml');
  context.COREX_HIGHLIGHT.render(article([first]));
  const originalHTML = first.innerHTML;
  first.textContent = 'different: false\n';
  const next = code('limit: 42\n', 'yaml');
  context.COREX_HIGHLIGHT.render(article([first, next]));
  assert.equal(first.innerHTML, originalHTML);
  assert.match(next.innerHTML, /class="hljs-number"/);
});

// A missing local script must leave readable snippets rather than breaking the wiki.
test('missing highlighter leaves code available without throwing', () => {
  const context = environment(false);
  const element = code('enabled: true\n', 'yaml');
  assert.doesNotThrow(() => context.COREX_HIGHLIGHT.render(article([element])));
  assert.equal(element.innerHTML, 'enabled: true\n');
});

// Both offline entry points must load the licensed local runtime before their renderers.
test('wiki and full reference load local highlighting assets in dependency order', () => {
  const vendor = 'assets/vendor/highlightjs/highlight.min.js';
  const properties = 'assets/vendor/highlightjs/languages/properties.min.js';
  const controller = 'assets/js/core/syntax-highlight.js';
  for (const file of ['index.html', 'reference.html']) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(html.includes('assets/css/syntax-highlight.css'), file + ' must load token styles');
    assert.ok(html.indexOf(vendor) >= 0 && html.indexOf(vendor) < html.indexOf(properties), file + ' must register properties after the core');
    assert.ok(html.indexOf(properties) < html.indexOf(controller), file + ' must load the controller after the grammars');
    assert.ok(html.indexOf(controller) < html.indexOf(file === 'index.html' ? 'assets/js/docs.js' : 'assets/js/core/reference-renderer.js'));
  }
  assert.match(fs.readFileSync(path.join(root, 'assets/vendor/highlightjs/LICENSE'), 'utf8'), /BSD|Redistribution/);
});
