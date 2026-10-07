# Website architecture

`index.html` and `reference.html` are generic shells. Product identity comes from `site-config.js`, landing prose from `landing-content.js`, interface wording from `ui-text.js`, and wiki metadata from `docs-content.js`. Readable article bodies under `assets/content/docs/` are compiled into `assets/js/generated/docs-bodies.js` for offline use.

Public YAML flows from the private plugin checkout through the strict `config-sync-map.mjs` allowlist into `synced-configs/paper/` and the generated offline config bundle. Credentials, private source and the separate resource-pack tree never enter config sync. Root compatibility pages retain previous bookmarks through `legacy-routes.js`.
