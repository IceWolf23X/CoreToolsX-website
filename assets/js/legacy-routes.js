/* Preserve the previous standalone CoreToolsX page URLs and authored bookmarks. */
(function (root) {
  'use strict';
  const routes = {
    'features.html': { route: '#/docs/overview', anchors: {
      'core-design': '#/docs/overview/introduction', 'progression': '#/docs/overview/progression-and-recipes',
      'recipes': '#/docs/overview/progression-and-recipes~recipe-model', 'metadata': '#/docs/overview/item-safety',
      'skins': '#/docs/overview/netherite-skins', 'model-mode': '#/docs/overview/netherite-skins~inventory-models',
      'lore': '#/docs/overview/netherite-skins~lore', 'durability': '#/docs/overview/netherite-skins~skin-durability',
      'removal': '#/docs/overview/netherite-skins~removal-and-fire', 'permissions': '#/docs/reference/permission-reference',
      'scope': '#/docs/overview/introduction~standalone-scope'
    } },
    'installation.html': { route: '#/docs/getting-started/installation', anchors: {
      'requirements': '#/docs/getting-started/installation~requirements', 'download': '#/docs/getting-started/installation~download',
      'install': '#/docs/getting-started/installation~install', 'generated-files': '#/docs/getting-started/installation~generated-files',
      'reload': '#/docs/getting-started/reload-vs-restart', 'first-test': '#/docs/getting-started/first-validation',
      'validation': '#/docs/getting-started/first-validation~production-validation-checklist'
    } },
    'configuration.html': { route: '#/docs/paper/files', anchors: {
      'before-you-configure': '#/docs/getting-started/installation', 'file-layout': '#/docs/paper/files~file-layout',
      'reload-vs-restart': '#/docs/getting-started/reload-vs-restart', 'clean-setup': '#/docs/getting-started/first-validation~clean-setup',
      'runtime-model': '#/docs/overview/introduction~runtime-model', 'starter-workflow': '#/docs/getting-started/first-validation',
      'config-first-pass': '#/docs/paper/config-yml', 'config-yml': '#/docs/paper/config-yml',
      'upgrade-editing': '#/docs/paper/tool-upgrades-yml~definition-schema', 'tool-upgrades-yml': '#/docs/paper/tool-upgrades-yml',
      'skin-editing': '#/docs/paper/tool-skins-yml~skin-schema', 'tool-skins-yml': '#/docs/paper/tool-skins-yml',
      'messages-yml': '#/docs/paper/messages-yml', 'permission-start': '#/docs/reference/permission-reference',
      'permissions': '#/docs/reference/permission-reference', 'first-recipe-tests': '#/docs/getting-started/first-validation',
      'troubleshooting-quick-reference': '#/docs/reference/troubleshooting-quick-reference',
      'production-validation-checklist': '#/docs/getting-started/first-validation~production-validation-checklist',
      'starter-profiles': '#/docs/getting-started/resource-pack-addon'
    } },
    'docs.html': { route: '#/docs/overview', anchors: null },
    'faq.html': { route: '#/docs/reference/faq', anchors: null },
    'support-policy.html': { route: '#/docs/reference/support-policy', anchors: {
      'release-channels': '#/docs/reference/support-policy~release-channels', 'supporter-preview-builds': '#/docs/reference/support-policy~supporter-preview-builds',
      'critical-fix-policy': '#/docs/reference/support-policy~critical-fix-policy', 'paid-memberships': '#/docs/reference/support-policy~paid-memberships',
      'discord-authentication': '#/docs/reference/support-policy~discord-authentication', 'disclaimer': '#/docs/reference/support-policy~disclaimer'
    } }
  };
  /** Select a fixed local wiki route, retaining only the legacy page's own authored section. */
  function target(page, hash) {
    const entry = routes[page];
    if (!entry) return 'index.html#/docs/overview';
    let anchor = '';
    try { anchor = decodeURIComponent(String(hash || '').replace(/^#/, '')); } catch (_) { /* Invalid bookmarks select the page root. */ }
    const route = entry.anchors ? (entry.anchors[anchor] || entry.route) : entry.route + (anchor ? '~' + encodeURIComponent(anchor) : '');
    return 'index.html' + route;
  }
  if (typeof module === 'object' && module.exports) module.exports = { target, routes };
  else if (root.document) root.location.replace(target(root.document.body.dataset.legacyPage, root.location.hash));
}(typeof window !== 'undefined' ? window : globalThis));
