# CoreToolsX website setup

## Local edit loop

Edit public identity in `assets/js/data/site-config.js`, landing prose in `landing-content.js`, catalog metadata in `docs-content.js`, and article prose in `assets/content/docs/`. Then run:

```powershell
node tools/build-docs-bundle.mjs .
node tools/build-docs-bundle.mjs . --check
node --test
node tests/validate-theme.mjs
```

Inspect both `index.html` and `reference.html` locally.

## Refresh public plugin defaults

```powershell
node tools/sync-plugin-configs.mjs ..\plugin .
node tools/build-config-bundle.mjs .
```

The allowlist contains only `config.yml`, `tool-upgrades.yml`, `tool-skins.yml` and `messages.yml`. Synced snapshots are LF-normalized text. Do not add `plugin.yml`, runtime data or `resource-pack/`; the pack is a separate distributable.

## Hero image

The local logo is configured in `site-config.js` under `assets.heroPreview.images`. Keep `objectFit: 'contain'` so the whole mark remains visible. One image stays static; add two or more local images only when a real gallery is available.

## Later GitHub configuration

Add `COREX_PLUGIN_READ_TOKEN` only when automated private-source sync is authorized. Grant read-only Contents access to `IceWolf23X/CoreToolsX-plugin`. The workflow is inert without it. `COREX_WEBSITE_WRITE_TOKEN` is optional only for bot commits when normal `GITHUB_TOKEN` permissions are insufficient.

Pages Actions additionally requires `COREX_PAGES_ENABLED=true`. Enabling, pushing and publishing are separate external actions.

## Public output

`node tools/prepare-pages.mjs .` builds ignored `_site/` from an allowlist. Verify CNAME, routes, assets, defaults and absence of secrets before publication.

## Privacy and sitemap

See [Privacy and crawl-discovery maintenance](docs/PRIVACY_AND_SEO.md) for editable notice content, controller/contact, canonical page inventory and required generation checks.
