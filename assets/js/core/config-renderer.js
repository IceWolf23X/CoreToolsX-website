(function () {
  'use strict';
  var data = window.COREX_CONFIG_FILES || { files: {} };
  var ui = window.COREX_UI || {};
  var codeUI = ui.code || {};

  function labelFor(format) {
    return format === 'yaml' ? 'YAML' : format === 'properties' ? 'Properties' : String(format || 'Text').toUpperCase();
  }

  function create(id) {
    var file = data.files && data.files[id];
    if (!file) {
      var missing = document.createElement('div');
      missing.className = 'source-box config-missing';
      missing.textContent = 'Configuration snapshot not available: ' + id;
      return missing;
    }
    var block = document.createElement('div');
    block.className = 'code-block config-synced-file' + (file.content.split('\n').length > 26 ? ' is-long' : '');
    block.dataset.configId = id;

    var header = document.createElement('div');
    header.className = 'code-header';
    var title = document.createElement('span');
    title.textContent = labelFor(file.format) + ' · ' + id.split('/').pop();
    var actions = document.createElement('div');

    if (block.classList.contains('is-long')) {
      var expand = document.createElement('button');
      expand.type = 'button';
      expand.className = 'expand-code';
      expand.setAttribute('aria-expanded', 'false');
      expand.textContent = codeUI.expand || 'Expand code';
      actions.appendChild(expand);
    }
    var copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'copy-code';
    copy.setAttribute('aria-label', (codeUI.copy || 'Copy') + ' ' + id.split('/').pop());
    copy.textContent = codeUI.copy || 'Copy';
    actions.appendChild(copy);
    header.appendChild(title);
    header.appendChild(actions);

    var pre = document.createElement('pre');
    pre.tabIndex = 0;
    var code = document.createElement('code');
    code.className = 'language-' + (file.format === 'yaml' ? 'yml' : file.format || 'text');
    code.textContent = file.content;
    pre.appendChild(code);

    var meta = document.createElement('div');
    meta.className = 'config-source-meta';
    var kind = file.sourceKind === 'generated-template' ? 'Generated runtime template' : 'Synced plugin default';
    meta.innerHTML = '<span>' + kind + '</span><a href="' + file.websitePath + '" download>Open source file</a>';

    block.appendChild(header);
    block.appendChild(pre);
    block.appendChild(meta);
    return block;
  }

  function renderMounts(root) {
    (root || document).querySelectorAll('.config-file-mount[data-config-file]').forEach(function (mount) {
      mount.replaceWith(create(mount.dataset.configFile));
    });
  }

  function get(id) { return data.files && data.files[id] || null; }

  window.COREX_CONFIG_VIEW = { create: create, renderMounts: renderMounts, get: get };
}());
