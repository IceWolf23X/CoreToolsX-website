import assert from 'node:assert/strict';
import test from 'node:test';
import { compareVersions, renderMarkdownSafe, classifyVersion } from '../tools/release-lib.mjs';

test('sorts numeric release versions newest first including multi-digit components', () => {
  const versions = ['2026.3.9','2026.3.10','2026.4.0-beta.1','2026.4.0','2025.12.0'];
  assert.deepEqual(versions.sort(compareVersions), ['2026.4.0','2026.4.0-beta.1','2026.3.10','2026.3.9','2025.12.0']);
});

test('classifies stable and prerelease tags', () => {
  assert.equal(classifyVersion('2026.4.0'), 'stable');
  assert.equal(classifyVersion('2026.4.0-beta.2'), 'beta');
  assert.equal(classifyVersion('2026.4.0-alpha.1'), 'alpha');
  assert.equal(classifyVersion('2026.4.0-rc.1'), 'rc');
});

test('renders common changelog markdown and escapes raw html', () => {
  const html = renderMarkdownSafe('# Changes\n\n- Added **feature**\n- Fixed `bug`\n\n[Docs](https://example.com)\n\n<script>alert(1)</script>');
  assert.match(html, /<h1>Changes<\/h1>/);
  assert.match(html, /<strong>feature<\/strong>/);
  assert.match(html, /<code>bug<\/code>/);
  assert.match(html, /href="https:\/\/example\.com"/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});
