# CoreToolsX website code index

## Runtime and content

- `index.html`, `reference.html` — Generic landing/wiki and complete-reference shells.
- `assets/js/data/site-config.js` — Public CoreToolsX identity, links, logo, optional website-release source and theme.
- `assets/js/data/landing-content.js` — All landing-page product prose and navigation.
- `assets/js/data/docs-content.js` — 19-article catalog, groups, navigation targets and raw-config mounts.
- `assets/content/docs/` — Readable article HTML grouped by overview, getting-started, paper and reference.
- `assets/js/legacy-routes.js` and root compatibility HTML — Preserve earlier public pages and authored section bookmarks.
- `assets/img/coretoolsx-logo.png` — Product logo/favicon and static contain-mode hero image.
- `assets/js/`, `assets/css/` — Shared CoreX browser engine, renderers, search, releases and styling.

## Configuration and generation

- `tools/config-sync-map.mjs` — Four-file allowlist for private `IceWolf23X/CoreToolsX-plugin` on `main`.
- `synced-configs/paper/` — Published LF-normalized defaults; excludes descriptor, runtime data and resource pack.
- `tools/sync-plugin-configs.mjs`, `build-config-bundle.mjs`, `build-docs-bundle.mjs` — Sync and deterministic offline bundles.
- `tools/build-releases.mjs`, `prepare-pages.mjs` — Optional public website-release snapshot and allow-listed Pages artifact.

## Automation and tests

- `.github/workflows/` — Optional config sync, release snapshot refresh and gated Pages deployment.
- `tests/` — Node validation for data, bundles, legacy bookmarks, gallery, releases, packaging, highlighting and utilities.
- `README.md`, `SETUP.md`, `docs/` — Editing, architecture, sync, gallery, releases and deployment guidance.

Excluded: private plugin source, `plugin.yml`, runtime/player data, separate resource-pack tree, secrets, ignored `_site/`, caches, archives and temporary files.

## Shared validation contracts

- `assets/coretoolsx-logo.svg` — Retained public legacy logo URL; current brand and hero use the supplied PNG.
- `assets/js/data/ui-text.js` — Shared interface labels; product naming comes from site data and platform wording is Paper-only.
- `assets/js/docs.js`, `assets/js/search.js`, `assets/js/core/renderer.js` — Navigation uses catalog metadata (`navigation`, `hubs.instructionStarts`, `searchSuggestions`) rather than another plugin's article IDs.
- `tools/sync-plugin-configs.mjs` — `confinedPath` and `syncDefaults` preflight the declared YAML allowlist, reject path escapes/symlinks/descriptors, normalize LF and record committed-source provenance. The CLI refuses edited source defaults.
- `tests/config-sync.test.mjs` — Boundary, missing-source, normalization and idempotence checks.
- `tests/legacy-contract.json`, `tests/legacy-pages.test.mjs` — Independent baseline of old pages/bookmarks and tests of their maintained article/section targets.
- `tests/browser_docs_content.cjs` — Real offline Chromium validation of every article/config, reference, search, logo and responsive layout; requires an already installed Node Playwright runtime.
- `.gitattributes` — LF policy for authored HTML/data and stable normalized config snapshots.
