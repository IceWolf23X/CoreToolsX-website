# Customization

- Identity, links, logo and palette: `assets/js/data/site-config.js`.
- Landing sections and copy: `assets/js/data/landing-content.js`.
- Wiki ordering/metadata: `assets/js/data/docs-content.js`.
- Article prose: `assets/content/docs/<article-id>.html`.
- Raw configuration mapping: `tools/config-sync-map.mjs`.

After article changes run `node tools/build-docs-bundle.mjs .`; after synchronized YAML changes run `node tools/build-config-bundle.mjs .`. Do not edit generated bundles manually. Keep Download pointed at Modrinth; document/distribute the REAL_TIER pack separately.
