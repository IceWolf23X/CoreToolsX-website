# Privacy and crawl-discovery maintenance

The public notice is generated from `assets/content/privacy.json`; product identity, public domain, theme key and release-cache settings come from `assets/js/data/site-config.js`. Shared legal navigation is declared in `assets/js/data/ui-text.js`. Edit the source data, then regenerate the public HTML. Do not hand-edit `privacy.html`.

```sh
node tools/build-page-meta.mjs .
node tools/build-privacy-page.mjs .
node tools/build-sitemap.mjs .
node tools/build-page-meta.mjs . --check
node tools/build-privacy-page.mjs . --check
node tools/build-sitemap.mjs . --check
node --test
node tests/validate-theme.mjs
node tools/prepare-pages.mjs .
```

The full-reference shell, landing, Releases and wiki link to the same static notice. It remains readable without JavaScript; the optional theme button reuses the site's existing preference. `boot.js` respects explicit standalone metadata. Neither the notice nor its theme control adds analytics, accounts, marketing cookies or new services.

The notice covers the website, not installed plugins or independently operated Minecraft servers. The confirmed controller/contact is maintained in the JSON source. Technical connection data, hosting/security providers, public release API/downloads, voluntary email correspondence, retention criteria and applicable rights are described explicitly. Do not replace this with a blanket claim that browsing involves no personal data.

A fresh-browser review on 8 October 2026 of all six production websites (home, theme selection and Releases) observed no cookies, session storage, external scripts or JavaScript errors. Requests reached the relevant site and the public GitHub API. Site code stores the theme and a public release cache locally. The cache is reused for 15 minutes; its old record is not automatically deleted at that deadline. These observations describe those visits, not every infrastructure security challenge. Private Cloudflare settings and provider-log retention were not inspected. Review the notice if hosting, security features or optional tracking change; this document is not a legal compliance certification.

## Canonical inventory

`assets/content/seo.json` lists real maintained pages. The builders derive absolute HTTPS addresses from `links.official`, produce UTF-8 `sitemap.xml` and maintain its reference in `robots.txt`, preserving unrelated crawler directives. The inventory includes the home page, `reference.html` and `privacy.html`. Existing compatibility pages remain available but are not listed as canonical pages. Hash-routed wiki/Release views and article fragments are not separate sitemap entries. The complete reference contains the documentation. No `lastmod` is fabricated from build time.

`prepare-pages.mjs` rejects stale notice/sitemap outputs before replacing an existing artifact. The optional Pages workflow rebuilds both; repository-root publication also requires committing regenerated output. A sitemap supports discovery but does not guarantee search indexing. No submission to Search Console or IndexNow is performed by these tools.

## Primary references

- [GitHub Pages visitor-data processing](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [GitHub privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)
- [Cloudflare privacy policy](https://www.cloudflare.com/privacypolicy/) and [technical-cookie documentation](https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/)
- [Google privacy policy](https://policies.google.com/privacy)
- [Modrinth privacy policy](https://modrinth.com/legal/privacy)
- [GDPR, including information duties and applicable rights](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng)
- [Garante guidance on cookies and similar technologies](https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/9677876)
- [Sitemap protocol](https://www.sitemaps.org/protocol.html) and [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google guidance on JavaScript and fragment navigation](https://developers.google.com/search/docs/crawling-indexing/javascript/fix-search-javascript)

## Initial search metadata

The home and full reference have product-specific titles, descriptions and one canonical URL in their initial HTML. `tools/build-page-meta.mjs` builds these from templates in `assets/content/seo.json` and identity fields in `site-config.js`; do not hand-edit the marked metadata blocks. The shared boot respects their `data-static-meta` marker. This removes the generic CoreX text previously delivered before JavaScript on five family sites. The builder preserves the application shell, and stale metadata blocks publication preflight.

References: [Google title-link guidance](https://developers.google.com/search/docs/appearance/title-link), [snippet descriptions](https://developers.google.com/search/docs/appearance/snippet) and [canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls). Search engines can choose their own displayed title or snippet. No ranking or indexing guarantee is made.
