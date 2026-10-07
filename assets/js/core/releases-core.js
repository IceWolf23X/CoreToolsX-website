/* Shared, dependency-free release formatting. Used by the browser and Node tools. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.COREX_RELEASES_CORE = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (c) { return {'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]; });
  }
  function safeLink(value) {
    var s = String(value || '').trim();
    if (/[\u0000-\u0020\u007f]/.test(s)) return '';
    return /^(https?:\/\/|mailto:|#)/i.test(s) ? s : '';
  }
  function inline(text, depth) {
    if ((depth || 0) > 5) return escapeHtml(text);
    // Consume original tokens once: emitted HTML is never reparsed as Markdown.
    var token = /`([^`\n]+)`|!?\[([^\]\n]+)\]\(([^\s)]+)\)|\*\*([^*\n]+)\*\*|~~([^~\n]+)~~|\*([^*\n]+)\*/g;
    var out = '', from = 0, match;
    while ((match = token.exec(text))) {
      out += escapeHtml(text.slice(from, match.index));
      if (match[1] !== undefined) out += '<code>' + escapeHtml(match[1]) + '</code>';
      else if (match[2] !== undefined) {
        var href = safeLink(match[3]);
        var label = inline(match[2], (depth || 0) + 1);
        // Remote images are links, not automatic tracking/image requests.
        out += href ? '<a href="' + escapeHtml(href) + '" target="_blank" rel="noopener noreferrer">' + label + '</a>' : label;
      } else if (match[4] !== undefined) out += '<strong>' + inline(match[4], (depth || 0) + 1) + '</strong>';
      else if (match[5] !== undefined) out += '<del>' + inline(match[5], (depth || 0) + 1) + '</del>';
      else out += '<em>' + inline(match[6], (depth || 0) + 1) + '</em>';
      from = token.lastIndex;
    }
    return out + escapeHtml(text.slice(from));
  }
  function cells(line) { return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(function (v) {return v.trim();}); }
  function renderMarkdownSafe(markdown) {
    var lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n');
    var out = [], para = [], list = '', fence = '', language = '', code = [];
    function flushPara() { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } }
    function flushList() { if (list) {out.push('</' + list + '>'); list = '';} }
    function flushCode() { out.push('<pre><code' + (language ? ' class="language-' + escapeHtml(language) + '"' : '') + '>' + escapeHtml(code.join('\n')) + '</code></pre>'); code = []; fence = ''; }
    for (var i = 0; i < lines.length; i++) {
      var raw = lines[i], m;
      if (fence) {
        if (new RegExp('^ {0,3}' + fence[0] + '{' + fence.length + ',}\\s*$').test(raw)) flushCode(); else code.push(raw);
        continue;
      }
      m = raw.match(/^ {0,3}(`{3,}|~{3,})\s*([\w+-]*)\s*$/);
      if (m) {flushPara(); flushList(); fence = m[1]; language = m[2]; continue;}
      if (!raw.trim()) {flushPara(); flushList(); continue;}
      if (raw.includes('|') && i + 1 < lines.length && cells(lines[i + 1]).length > 1 && cells(lines[i + 1]).every(function (c) {return /^:?-{3,}:?$/.test(c);})) {
        flushPara(); flushList();
        out.push('<div class="release-table"><table><thead><tr>' + cells(raw).map(function (c) {return '<th>' + inline(c) + '</th>';}).join('') + '</tr></thead><tbody>');
        i++;
        while (i + 1 < lines.length && lines[i + 1].trim() && lines[i + 1].includes('|')) {
          out.push('<tr>' + cells(lines[++i]).map(function (c) {return '<td>' + inline(c) + '</td>';}).join('') + '</tr>');
        }
        out.push('</tbody></table></div>'); continue;
      }
      m = raw.match(/^(#{1,6})\s+(.+)$/);
      if (m) {flushPara(); flushList(); var n = m[1].length; out.push('<h' + n + '>' + inline(m[2]) + '</h' + n + '>'); continue;}
      if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(raw)) {flushPara(); flushList(); out.push('<hr>'); continue;}
      m = raw.match(/^\s*(?:([-*+])|\d+[.)])\s+(.+)$/);
      if (m) {
        flushPara(); var type = m[1] ? 'ul' : 'ol';
        if (list !== type) {flushList(); list = type; out.push('<' + type + '>');}
        out.push('<li>' + inline(m[2]) + '</li>'); continue;
      }
      m = raw.match(/^>\s?(.*)$/);
      if (m) {flushPara(); flushList(); out.push('<blockquote>' + inline(m[1]) + '</blockquote>'); continue;}
      flushList(); para.push(raw.trim());
    }
    if (fence) flushCode(); flushPara(); flushList(); return out.join('\n');
  }
  function classifyVersion(version, prerelease) {
    var v = String(version).toLowerCase();
    for (var name of ['alpha', 'beta', 'rc']) if (new RegExp('(?:^|[-.])' + name + '(?:[.-]|$)').test(v)) return name;
    return prerelease ? 'prerelease' : 'stable';
  }
  function parsed(version) {
    var match = String(version).replace(/^v(?=\d)/i, '').match(/^(\d+(?:\.\d+)*)(?:-([^+]+))?(?:\+.*)?$/);
    return match ? {numbers: match[1].split('.').map(Number), pre: match[2] || ''} : null;
  }
  function compareVersions(a, b) {
    var A = parsed(a), B = parsed(b);
    if (!A || !B) return String(b).localeCompare(String(a), 'en', {numeric:true, sensitivity:'base'});
    for (var i = 0; i < Math.max(A.numbers.length, B.numbers.length); i++) {
      var diff = (B.numbers[i] || 0) - (A.numbers[i] || 0); if (diff) return diff;
    }
    if (!A.pre || !B.pre) return A.pre ? 1 : B.pre ? -1 : 0;
    var ranks = {alpha:0, beta:1, rc:2};
    var ap = A.pre.split(/[.-]/), bp = B.pre.split(/[.-]/);
    if (ap[0] !== bp[0] && ap[0] in ranks && bp[0] in ranks) return ranks[bp[0]] - ranks[ap[0]];
    return B.pre.localeCompare(A.pre, 'en', {numeric:true, sensitivity:'base'});
  }
  return {escapeHtml:escapeHtml, renderMarkdownSafe:renderMarkdownSafe, classifyVersion:classifyVersion, compareVersions:compareVersions};
}));
