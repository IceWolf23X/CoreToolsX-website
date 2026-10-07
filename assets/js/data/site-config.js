/* Public CoreToolsX identity, links, release source and theme tokens. */
window.COREX_SITE = {
  schemaVersion: 1,
  brand: {
    family: 'CoreX', product: 'CoreToolsX', author: 'IceWolf23X', familyLabel: 'A CoreX plugin',
    tagline: 'Tool progression, kept vanilla.', language: 'en',
    logo: 'assets/img/coretoolsx-logo.png', favicon: 'assets/img/coretoolsx-logo.png',
    description: 'CoreToolsX adds configurable vanilla crafting progression and netherite tool skins to Paper servers.'
  },
  links: {
    download: 'https://modrinth.com/plugin/coretoolsx',
    modrinth: 'https://modrinth.com/plugin/coretoolsx',
    github: 'https://github.com/IceWolf23X/CoreToolsX-issues',
    issues: 'https://github.com/IceWolf23X/CoreToolsX-issues/issues',
    official: 'https://wiki-coretoolsx.icewolf23x.dev/'
  },
  releases: {
    provider: 'github', owner: 'IceWolf23X', repository: 'CoreToolsX-website',
    cacheMinutes: 15, requestTimeoutMs: 10000, maxPages: 10,
    assetNames: { paper: ['CoreToolsX-*.jar', '*coretoolsx*.jar'], velocity: [] }
  },
  assets: {
    heroPreview: {
      images: [{ src: 'assets/img/coretoolsx-logo.png', alt: 'CoreToolsX plugin logo' }],
      autoplay: false, intervalMs: 5000, transitionMs: 240, pauseOnHover: true,
      objectFit: 'contain', src: '', alt: 'CoreToolsX plugin logo'
    }
  },
  theme: {
    default: 'light', storageKey: 'corex.theme',
    light: { accent: '#354ed1', accentHover: '#293ca9', accentSoft: '#edf0ff', accentLine: '#cbd3fb', onAccent: '#ffffff', page: '#fcfcfb', surface: '#ffffff', surfaceAlt: '#f5f5f3', surfaceHover: '#eeedeb', ink: '#24232a', muted: '#65636f', quiet: '#726d7a', line: '#e7e5e9', lineStrong: '#d4d1da' },
    dark: { accent: '#8da8ff', accentHover: '#afc2ff', accentSoft: '#222b47', accentLine: '#405686', onAccent: '#142044', page: '#17171a', surface: '#1d1d21', surfaceAlt: '#232327', surfaceHover: '#2b2a30', ink: '#eeedf1', muted: '#aaa7b3', quiet: '#8c8797', line: '#313037', lineStrong: '#45424e' }
  }
};
