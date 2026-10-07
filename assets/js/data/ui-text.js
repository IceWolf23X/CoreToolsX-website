/* Shared interface wording. Product/editorial content lives in landing-content.js and docs-content.js. */
window.COREX_UI = {
  skipToContent: 'Skip to content',
  theme: {
    toDark: 'Switch to dark theme',
    toLight: 'Switch to light theme',
    switchTitle: 'Switch theme'
  },
  header: {
    searchLabel: 'Search documentation (Control K)',
    searchTitle: 'Search documentation · Ctrl K',
    menuOpen: 'Open navigation',
    download: 'Download'
  },
  gallery: {
    label: 'In-game screenshot gallery',
    carousel: 'carousel',
    controls: 'Gallery controls',
    previous: 'Previous image',
    next: 'Next image',
    play: 'Play slideshow',
    pause: 'Pause slideshow',
    playShort: 'Play',
    pauseShort: 'Pause',
    showImage: 'Show image {index}',
    imageOf: 'Image {index} of {total}',
    clickHint: 'Click to show the next image'
  },
  releases: {
    eyebrow: window.COREX_SITE.brand.product + ' releases',
    title: 'Download a build.',
    description: 'Choose a version, read its changelog, then download the Paper JAR from GitHub.',
    latest: 'Latest stable', stable: 'Stable', beta: 'Beta', alpha: 'Alpha', rc: 'Release candidate', prerelease: 'Pre-release',
    releasedBuilds: 'Available versions', paper: 'Paper', velocity: 'Velocity',
    downloadPaper: 'Download Paper', downloadVelocity: 'Download Velocity', changelog: 'Changelog',
    changelogSource: 'GitHub release notes',
    noChangelog: 'No release notes were provided for this version.',
    noReleasesTitle: 'No releases published yet.',
    noReleasesText: 'Published releases with a Paper JAR will appear here automatically.',
    loadingTitle: 'Loading releases…', loadingText: 'Retrieving published builds from GitHub.',
    unavailableTitle: 'Release list unavailable.',
    unavailableText: 'The release list could not be refreshed. You can still check the repository on GitHub.',
    notFoundTitle: 'Release not found.', notFoundText: 'That version is not present in the available release data.',
    checksum: 'SHA-256', size: 'Size', copyChecksum: 'Copy checksum', copied: 'Copied',
    checksumUnavailable: 'SHA-256 not supplied by GitHub for this asset.',
    backToReleases: 'All releases', modrinthFallback: 'View on Modrinth', github: 'View on GitHub',
    refresh: 'Refresh', refreshing: 'Refreshing…', sourceLive: 'Loaded from GitHub', sourceCache: 'Cached GitHub data',
    sourceSnapshot: 'Bundled release snapshot', updated: 'Updated', published: 'Published',
    networkError: 'GitHub is unavailable. Showing the last available data.',
    emptyError: 'GitHub is unavailable and no saved release data is available.',
    rateLimit: 'GitHub temporarily limited API requests. Saved data remains available.',
    repositoryError: 'The repository could not be found or is not public. Check the release settings.',
    paginationError: 'The complete catalog exceeds the configured page limit. Saved data is unchanged.',
    configurationError: 'Check owner and repository in site-config.js.', retryAfter: 'Retry after',
    assetWarning: 'Some ambiguous assets were omitted. Check the filenames on GitHub.',
    onlineDownloads: 'Downloads are hosted on GitHub and require an Internet connection.',
    pageTitle: 'Releases', downloadTitle: 'Download'
  },
  docs: {
    mobileMenu: 'Documentation menu',
    mobileSearch: 'Search',
    sidebarTitle: 'Documentation',
    sidebarSearch: 'Search the docs',
    overviewTab: 'Overview',
    instructionsTab: 'Instructions',
    sidebarBottom: 'Documentation scope',
    onThisPage: 'On this page',
    tocIntroduction: 'Introduction',
    helpText: 'Need a different answer?\nSearch features, commands or an exact configuration key.',
    troubleshooting: 'Troubleshooting',
    reportIssue: 'Report an issue',
    fullReference: 'Full reference',
    bottomNote: 'reference · Paper plugin',
    scope: 'Documentation scope',
    articleTools: {
      copy: 'Copy page text',
      print: 'Print',
      fullReference: 'Full reference'
    },
    pagination: {
      previous: 'Previous article',
      next: 'Next article'
    },
    notFound: {
      title: 'Page not found',
      description: 'This documentation link does not match an article in the wiki.',
      body: 'Use the documentation menu or search for a feature, command or configuration key.',
      action: 'Back to documentation',
      breadcrumb: 'Unknown page'
    },
    hubs: {
      overview: {
        title: 'The complete feature overview.',
        description: 'Explore the plugin features, supported workflows and operating limits in one place.',
        kicker: 'Overview',
        introStrong: window.COREX_SITE.brand.tagline,
        introText: 'Read the feature overview, then follow the installation and configuration guides for your server.'
      },
      instructions: {
        title: 'Configuration, explained.',
        description: 'From the first install to the last setting. The complete setup, configuration, runtime-data and operational reference for Paper.',
        kicker: 'Instructions',
        standaloneTitle: 'Standalone Paper',
        standaloneText: 'Start with one server →',
      }
    }
  },
  search: {
    title: 'Search documentation',
    placeholder: 'Search features, commands, configuration…',
    ariaLabel: 'Search documentation',
    close: 'Close search',
    usefulStart: 'Useful places to start',
    matchSingular: 'matching article',
    matchPlural: 'matching articles',
    emptyPrefix: 'No matches for',
    emptyHint: 'Try a filename such as config.yml, a command or a shorter configuration key.',
    navigate: 'Navigate',
    open: 'Open',
    escape: 'Close',
    local: 'Local search · No connection needed'
  },
  code: {
    copy: 'Copy',
    copied: 'Copied',
    select: 'Select code',
    expand: 'Expand code',
    collapse: 'Collapse code',
    selectedNotice: 'Code selected. Press Ctrl+C to copy.'
  }
};
