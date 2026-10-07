# Local preparation and Pages deployment

Local authoring, tests and `_site` generation do not publish anything. The Pages workflow is gated by repository variable `COREX_PAGES_ENABLED=true`, rebuilds both offline bundles, runs Node tests and validation, and uploads only the allow-listed `_site/` artifact. A commit/push and enabling Pages remain separately authorized actions. Preserve `CNAME` and inspect the artifact for secrets before publication.
