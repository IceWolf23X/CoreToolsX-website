/* Product copy for the CoreToolsX landing page; the HTML entrypoint stays generic. */
window.COREX_LANDING = {
  order: ['hero', 'compatibility', 'features', 'setup', 'docsPromo', 'faq', 'finalCta'],
  header: { nav: [
    { label: 'Features', href: '#/features', nav: 'features' }, { label: 'Setup', href: '#/setup', nav: 'setup' },
    { label: 'Documentation', href: '#/docs/overview', nav: 'docs', docsLink: true },
    { label: 'FAQ', href: '#/docs/reference/faq', nav: 'faq', docsLink: true },
    { label: 'Releases', href: '#/releases', nav: 'releases' }
  ] },
  hero: {
    eyebrow: 'Vanilla crafting, controlled progression', title: [{ text: 'Tool progression,' }, { text: 'kept vanilla.', accent: true }],
    description: 'Guide tools from wood through stone, copper and iron, then branch toward diamond or gold. Add netherite visual skins with an optional inventory-model pack.',
    actions: [{ label: 'Download on Modrinth', linkKey: 'download', icon: 'arrow', style: 'primary', external: true }, { label: 'Read the setup guide', href: '#/docs/getting-started/installation', icon: 'book', docsLink: true }],
    platforms: ['Paper 1.21.11+', 'Java 21+'],
    preview: { assetKey: 'heroPreview', ariaLabel: 'CoreToolsX product preview', topLeft: 'CORETOOLSX / PAPER', placeholderLabel: 'PLUGIN PREVIEW', placeholderTitle: 'Tools with a progression path.', placeholderText: 'Use crafting, permissions and safe item metadata.', dimensions: 'PLUGIN LOGO / 512×512', captionLeft: 'CoreToolsX 2026.1.2', captionRight: 'Paper only', tag: 'Optional model pack.' }
  },
  compatibility: {
    labelLines: ['BUILT FOR', 'VANILLA+ SERVERS'],
    items: [{ label: 'Paper 1.21.11+', icon: 'server' }, { label: 'Java 21+', icon: 'code' }, { label: '6 tool types', icon: 'box' }, { label: 'YAML configuration', icon: 'file' }, { label: 'Permission locks', icon: 'key' }, { label: 'Optional pack', icon: 'image' }]
  },
  features: {
    id: 'features', number: '01 /', eyebrow: 'Progression and skins', title: ['A clear path.', 'A familiar Minecraft feel.'],
    description: 'CoreToolsX changes the route to an item, then leaves normal upgraded tools clean and vanilla.',
    cards: [
      { icon: 'layers', title: 'Configurable tool progression.', text: 'Default routes move wood through stone, copper and iron, with diamond and gold endpoints.', link: { label: 'See the progression', href: '#/docs/overview/progression-and-recipes' } },
      { icon: 'box', title: 'Six supported tool types.', text: 'Swords, pickaxes, axes, shovels, hoes and spears share a consistent recipe cost model.', link: { label: 'Understand recipe matching', href: '#/docs/overview/progression-and-recipes~supported-tools' } },
      { icon: 'shield', title: 'Netherite behavior, vanilla looks.', text: 'Apply wood, stone, copper, iron, gold or diamond skins while retaining netherite-equivalent components.', link: { label: 'Explore skins', href: '#/docs/overview/netherite-skins' } },
      { icon: 'image', title: 'Choose the inventory model.', text: 'Use VISUAL_SKIN with no pack, or install the separate addon for REAL_TIER inventory and ground models.', link: { label: 'Read the pack guide', href: '#/docs/getting-started/resource-pack-addon' } },
      { icon: 'key', title: 'Locks without player data.', text: 'Permission nodes gate upgrades, skins or use. CoreToolsX stores no player progression database.', link: { label: 'Review permissions', href: '#/docs/reference/permission-reference' } },
      { icon: 'shield', title: 'Metadata-aware transformations.', text: 'Preserve supported item data and block foreign custom-item PDC by default.', link: { label: 'Review item safety', href: '#/docs/overview/item-safety' } }
    ],
    bottom: { strong: 'Standalone by design.', text: 'No Vault, PlaceholderAPI, database, GUI library, CoreArmorX or mandatory resource pack.', link: { label: 'Read the complete overview', href: '#/docs/overview' } }
  },
  setup: {
    id: 'setup', number: '02 /', eyebrow: 'One Paper plugin', title: ['Install once.', 'Tune the path in YAML.'], tabAriaLabel: 'CoreToolsX deployment',
    modes: [{ id: 'paper', tabLabel: 'Paper server', tabIcon: 'server', title: 'CoreToolsX runs on Paper.', text: 'Install the JAR, start once, then edit four generated YAML files. Add the separate resource pack only for REAL_TIER mode.', steps: ['Download the current JAR from Modrinth.', 'Place it in the Paper server plugins folder and start once.', 'Edit plugins/CoreToolsX/*.yml and run /coretoolsx reload.'], link: { label: 'Follow the installation guide', href: '#/docs/getting-started/installation' }, topology: { labelLeft: 'DEPLOYMENT / PAPER', labelRight: 'SERVER-SIDE', nodes: [{ icon: 'users', label: 'Players' }, { icon: 'server', label: 'Paper', small: 'CoreToolsX', primary: true }, { icon: 'file', label: '4 YAML files' }], note: 'The optional REAL_TIER pack is a separate client asset, not a generated plugin file.' } }]
  },
  docsPromo: {
    eyebrow: 'Configuration without guesswork.', title: ['Every public default.', 'Every operational boundary.'], description: 'Search exact keys, inspect synchronized YAML, and follow focused guides for recipes, skins, models, permissions and troubleshooting.',
    cards: [{ icon: 'layers', title: 'Feature overview', href: '#/docs/overview', text: 'Progression, skins, metadata and compatibility in practical terms.' }, { icon: 'code', title: 'Paper configuration', href: '#/docs/paper/files', text: 'The four generated files with synchronized defaults and complete schemas.' }]
  },
  faq: {
    id: 'faq', number: '03 /', eyebrow: 'Before you install', title: 'CoreToolsX essentials.', description: 'Short answers for the choices that affect a real server.', introLink: { label: 'Open the full FAQ', href: '#/docs/reference/faq' },
    items: [
      { question: 'Is a resource pack required?', answer: 'No for the default VISUAL_SKIN mode. The separate addon is required only for REAL_TIER inventory models.', link: { label: 'Read the pack guide', href: '#/docs/getting-started/resource-pack-addon' } },
      { question: 'Which items are supported?', answer: 'Swords, pickaxes, axes, shovels, hoes and spears use the default upgrade and skin model.', link: { label: 'Read recipe behavior', href: '#/docs/overview/progression-and-recipes' } },
      { question: 'Do config edits require a restart?', answer: 'Normal YAML and recipe changes reload with /coretoolsx reload. Replacing the JAR or runtime requires a restart.', link: { label: 'See reload boundaries', href: '#/docs/getting-started/reload-vs-restart' } },
      { question: 'Can skins be removed?', answer: 'Yes. By default, craft the skinned tool with shears; the shears lose one durability and the tool returns to clean netherite.', link: { label: 'Read skin lifecycle', href: '#/docs/overview/netherite-skins~removal-and-fire' } }
    ]
  },
  finalCta: { title: ['Build the tool path', 'your server needs.'], description: 'Start with the stable build, then change only the progression, skins and locks you want.', actions: [{ label: 'Download on Modrinth', linkKey: 'download', icon: 'arrow', style: 'primary', external: true }, { label: 'Open configuration', href: '#/docs/paper/config-yml', icon: 'book' }] },
  footer: { caption: 'Tool progression, kept vanilla.', nav: [{ label: 'Overview', href: '#/docs/overview' }, { label: 'Setup', href: '#/docs/getting-started/installation' }, { label: 'Configuration', href: '#/docs/paper/files' }, { label: 'Issues', linkKey: 'issues', external: true }, { label: 'Modrinth', linkKey: 'modrinth', external: true }], copyright: '© 2026 CoreToolsX · A CoreX plugin by IceWolf23X.', scopeLink: { label: 'Documentation scope', href: '#/docs/reference/source-notes' } }
};
