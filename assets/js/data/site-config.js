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
    light: { accent: '#354ed1', accentHover: '#293ca9', accentSoft: '#edf0ff', accentLine: '#cbd3fb', onAccent: '#ffffff', page: '#fbfcff', surface: '#ffffff', surfaceAlt: '#f2f4fc', surfaceHover: '#e8ecf8', ink: '#23283c', muted: '#5f6882', quiet: '#646e88', line: '#e0e5f2', lineStrong: '#c8d0e5' },
    dark: { accent: '#8da8ff', accentHover: '#afc2ff', accentSoft: '#222b47', accentLine: '#405686', onAccent: '#142044', page: '#161923', surface: '#1c2230', surfaceAlt: '#252d3e', surfaceHover: '#2e384c', ink: '#edf1fb', muted: '#a7b3cf', quiet: '#8c9dbd', line: '#303c54', lineStrong: '#445574' }
  }
};
