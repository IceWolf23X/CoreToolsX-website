/* CoreToolsX documentation catalog; article prose lives in assets/content/docs/. */
window.COREX_DOCS = {
  schemaVersion: 2,
  meta: { product: 'CoreToolsX', articleCount: 19, pluginVersion: '2026.1.2', editingModel: 'Edit article HTML in assets/content/docs/ and rebuild the offline bundle.' },
  groups: [
    { id: 'overview', label: 'Feature overview', icon: 'layers' }, { id: 'getting-started', label: 'Getting started', icon: 'server' },
    { id: 'paper', label: 'Paper configuration', icon: 'code' }, { id: 'reference', label: 'Reference', icon: 'book' }
  ],
  navigation: { scope: 'reference/source-notes', troubleshooting: 'reference/troubleshooting-quick-reference' },
  searchSuggestions: ['getting-started/installation', 'getting-started/resource-pack-addon', 'paper/config-yml', 'reference/command-reference', 'reference/permission-reference'],
  hubs: { instructionStarts: ['getting-started/installation', 'paper/config-yml'], overviewCategories: [
    { label: 'Core behavior', articles: ['introduction', 'progression-and-recipes'] },
    { label: 'Skins and safety', articles: ['netherite-skins', 'item-safety'] }
  ] },
  articles: [
    { id: 'overview/introduction', group: 'overview', title: 'What CoreToolsX Does', description: 'Scope, requirements and the clean-item runtime model.', icon: 'layers', bodyFile: 'assets/content/docs/overview/introduction.html' },
    { id: 'overview/progression-and-recipes', group: 'overview', title: 'Progression and Recipes', description: 'Supported tools, default routes and matching rules.', icon: 'box', bodyFile: 'assets/content/docs/overview/progression-and-recipes.html' },
    { id: 'overview/netherite-skins', group: 'overview', title: 'Netherite Tool Skins', description: 'Visual tiers, model modes, lore, durability and removal.', icon: 'shield', bodyFile: 'assets/content/docs/overview/netherite-skins.html' },
    { id: 'overview/item-safety', group: 'overview', title: 'Item Safety and Compatibility', description: 'Preserved metadata, foreign PDC and supported boundaries.', icon: 'shield', bodyFile: 'assets/content/docs/overview/item-safety.html' },
    { id: 'getting-started/installation', group: 'getting-started', title: 'Installation', description: 'Paper and Java requirements, download, first boot and file layout.', icon: 'server', bodyFile: 'assets/content/docs/getting-started/installation.html' },
    { id: 'getting-started/reload-vs-restart', group: 'getting-started', title: 'Reload vs Restart', description: 'What changes live and what needs a clean boot.', icon: 'sliders', bodyFile: 'assets/content/docs/getting-started/reload-vs-restart.html' },
    { id: 'getting-started/resource-pack-addon', group: 'getting-started', title: 'Resource Pack Addon', description: 'When REAL_TIER needs the separate client-side model pack.', icon: 'image', bodyFile: 'assets/content/docs/getting-started/resource-pack-addon.html' },
    { id: 'getting-started/first-validation', group: 'getting-started', title: 'First Validation', description: 'A focused production setup and recipe checklist.', icon: 'file', bodyFile: 'assets/content/docs/getting-started/first-validation.html' },
    { id: 'paper/files', group: 'paper', title: 'Configuration Files', description: 'The four generated public files and their responsibilities.', icon: 'file', bodyFile: 'assets/content/docs/paper/files.html' },
    { id: 'paper/config-yml', group: 'paper', title: 'config.yml', description: 'Global recipe, model, lore, removal, lock and compatibility settings.', icon: 'code', configFile: { type: 'config-file', id: 'paper/config.yml' }, bodyFile: 'assets/content/docs/paper/config-yml.html' },
    { id: 'paper/tool-upgrades-yml', group: 'paper', title: 'tool-upgrades.yml', description: 'Tool route definitions, costs, ingredients and permissions.', icon: 'code', configFile: { type: 'config-file', id: 'paper/tool-upgrades.yml' }, bodyFile: 'assets/content/docs/paper/tool-upgrades-yml.html' },
    { id: 'paper/tool-skins-yml', group: 'paper', title: 'tool-skins.yml', description: 'Visual skins and cosmetic durability by skin and tool type.', icon: 'code', configFile: { type: 'config-file', id: 'paper/tool-skins.yml' }, bodyFile: 'assets/content/docs/paper/tool-skins-yml.html' },
    { id: 'paper/messages-yml', group: 'paper', title: 'messages.yml', description: 'MiniMessage command, crafting, progression and inspection text.', icon: 'code', configFile: { type: 'config-file', id: 'paper/messages.yml' }, bodyFile: 'assets/content/docs/paper/messages-yml.html' },
    { id: 'reference/command-reference', group: 'reference', title: 'Command Reference', description: 'Command syntax, sender limits and permission checks.', icon: 'terminal', bodyFile: 'assets/content/docs/reference/command-reference.html' },
    { id: 'reference/permission-reference', group: 'reference', title: 'Permission Reference', description: 'Admin, bypass, upgrade, skin and usage nodes.', icon: 'key', bodyFile: 'assets/content/docs/reference/permission-reference.html' },
    { id: 'reference/troubleshooting-quick-reference', group: 'reference', title: 'Troubleshooting', description: 'Startup, recipes, models, permissions, items and config checks.', icon: 'help', bodyFile: 'assets/content/docs/reference/troubleshooting-quick-reference.html' },
    { id: 'reference/faq', group: 'reference', title: 'Frequently Asked Questions', description: 'Short answers for server owners and administrators.', icon: 'help', bodyFile: 'assets/content/docs/reference/faq.html' },
    { id: 'reference/support-policy', group: 'reference', title: 'Support and Release Policy', description: 'Stable releases, previews, critical fixes and memberships.', icon: 'book', bodyFile: 'assets/content/docs/reference/support-policy.html' },
    { id: 'reference/source-notes', group: 'reference', title: 'Documentation Scope', description: 'Version, evidence, configuration sync and public/private boundaries.', icon: 'file', bodyFile: 'assets/content/docs/reference/source-notes.html' }
  ]
};
