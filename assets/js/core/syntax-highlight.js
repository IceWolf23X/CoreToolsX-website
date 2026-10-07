// Highlight explicitly labelled documentation blocks without changing their source text.
(function () {
  'use strict';

  // Render trusted token markup from raw text and skip unknown or already processed blocks.
  function highlightBlock(code, library) {
    if (code.dataset.highlighted === 'yes') return;
    var match = /\blanguage-([\w-]+)\b/.exec(code.className);
    if (!match || /^(text|plaintext)$/.test(match[1]) || !library.getLanguage(match[1])) return;
    code.innerHTML = library.highlight(code.textContent, { language: match[1], ignoreIllegals: true }).value;
    code.classList.add('hljs');
    code.dataset.highlighted = 'yes';
  }

  // Apply highlighting after an article or the offline reference inserts its final code nodes.
  function render(root) {
    var library = window.hljs;
    if (!library) return;
    var blocks = (root || document).querySelectorAll('pre code');
    for (var i = 0; i < blocks.length; i += 1) highlightBlock(blocks[i], library);
  }

  window.COREX_HIGHLIGHT = { render: render };
}());
