/* Pure search and escaping helpers. Shared by the browser and Node unit tests. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CCX_UTILS = factory();
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function normalize(value) { return String(value).normalize('NFKD').toLowerCase().trim(); }
  function search(index, query, limit) {
    var needle = normalize(query).slice(0, 180);
    if (!needle) return [];
    var terms = needle.split(/\s+/).filter(Boolean);
    var results = [];
    index.forEach(function (item) {
      var title = normalize(item.title), section = normalize(item.section || '');
      var content = normalize(item.text), combined = title + ' ' + section + ' ' + content;
      if (!terms.every(function (word) { return combined.indexOf(word) !== -1; })) return;
      var score = 0;
      if (title === needle) score += 150;
      if (title.indexOf(needle) !== -1) score += 70;
      if (section.indexOf(needle) !== -1) score += 45;
      if (content.indexOf(needle) !== -1) score += 25;
      terms.forEach(function (word) {
        if (title.indexOf(word) !== -1) score += 15;
        if (section.indexOf(word) !== -1) score += 8;
      });
      score += item.boost || 0;
      var at = content.indexOf(needle);
      if (at < 0) at = content.indexOf(terms[0]);
      var start = Math.max(0, at - 58);
      var excerpt = item.text.slice(start, start + 210);
      if (start) excerpt = '…' + excerpt;
      if (start + 210 < item.text.length) excerpt += '…';
      results.push(Object.assign({}, item, { score: score, excerpt: excerpt }));
    });
    results.sort(function (a, b) { return b.score - a.score || a.title.localeCompare(b.title); });
    var unique = [], seen = new Set();
    results.forEach(function (item) {
      // Show the strongest matching section per article, rather than duplicate pages.
      if (!seen.has(item.id)) { seen.add(item.id); unique.push(item); }
    });
    return unique.slice(0, limit || 16);
  }
  function routeParts(hash) {
    var value = String(hash || '').replace(/^#/, '');
    try { value = decodeURIComponent(value); } catch (_) { return { view:'docs', id:'not-found', anchor:'' }; }
    if (/^\/releases(?:\/|$)/.test(value)) {
      var release = value.replace(/^\/releases\/?/, '');
      if (release && !/^[A-Za-z0-9][A-Za-z0-9._+\/-]*$/.test(release)) return {view:'releases',id:'not-found',anchor:''};
      return { view:'releases', id:release, anchor:'' };
    }
    if (value.indexOf('/docs') === 0) {
      var full = value.replace(/^\/docs\/?/, '') || 'overview';
      var sep = full.indexOf('~');
      var id=sep < 0 ? full : full.slice(0, sep), anchor=sep < 0 ? '' : full.slice(sep + 1);
      // Routes are generated slugs, never HTML or arbitrary user-provided URLs.
      if (!/^[a-z0-9]+(?:[\/-][a-z0-9]+)*$/.test(id) || (anchor && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(anchor))) {
        return {view:'docs',id:'not-found',anchor:''};
      }
      return { view:'docs', id:id, anchor:anchor };
    }
    return { view:'landing', id:'', anchor:value.replace(/^\//, '') };
  }
  return { escapeHTML:escapeHTML, search:search, routeParts:routeParts };
}));
