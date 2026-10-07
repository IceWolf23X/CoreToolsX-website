const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const f=__dirname+'/../assets/js/core/releases-core.js';const lib=fs.existsSync(f)?require(f):{};
test('markdown escapes scripts, raw HTML and executable protocols',()=>{
 const h=lib.renderMarkdownSafe('<img src=x onerror=alert(1)>\n\n[x](javascript:alert(1))\n\n<script>alert(1)</script>');
 assert.doesNotMatch(h,/<script|<img|href="javascript/i);assert.match(h,/&lt;script&gt;/);
});
test('inline code is not reparsed as links or emphasis and link queries are escaped once',()=>{
 const h=lib.renderMarkdownSafe('`**literal** [x](https://example.com)`\n\n[Docs](https://example.com/?a=1&b=2)');
 assert.match(h,/<code>\*\*literal\*\* \[x\]\(https:\/\/example.com\)<\/code>/);
 assert.match(h,/a=1&amp;b=2/);assert.doesNotMatch(h,/amp;amp/);
});
test('markdown includes headings, fenced code, quotes, lists, tables, strikethrough and safe image links',()=>{
 const h=lib.renderMarkdownSafe('# Title\n\n- **One**\n- ~~Two~~\n\n> Note\n\n```yaml\nx: <tag>\n```\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\n![image](https://example.com/a.png)');
 for(const needle of ['<h1>Title','<strong>One','<del>Two','<blockquote>','<pre><code','&lt;tag&gt;','<table>','<td>1','https://example.com/a.png'])assert.ok(h.includes(needle),needle);
 assert.doesNotMatch(h,/<img/);
});
