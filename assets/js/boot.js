/* Apply product identity and theme before first paint, preserving explicit standalone page metadata. */
(function () {
  'use strict';
  var cfg = window.COREX_SITE || {};
  var themeCfg = cfg.theme || {};
  var brand = cfg.brand || {};
  var tokenMap = {
    accent:'--accent', accentHover:'--accent-hover', accentSoft:'--accent-soft', accentLine:'--accent-line', onAccent:'--on-accent',
    page:'--page', surface:'--surface', surfaceAlt:'--surface-alt', surfaceHover:'--surface-hover', ink:'--ink', muted:'--muted', quiet:'--quiet', line:'--line', lineStrong:'--line-strong'
  };
  function apply(theme) {
    if (theme !== 'dark' && theme !== 'light') theme = themeCfg.default || 'light';
    document.documentElement.dataset.theme = theme;
    var values = themeCfg[theme] || {};
    Object.keys(tokenMap).forEach(function (key) {
      if (values[key]) document.documentElement.style.setProperty(tokenMap[key], values[key]);
    });
    return theme;
  }
  var theme = themeCfg.default || 'light';
  try {
    var stored = localStorage.getItem(themeCfg.storageKey || 'corex.theme');
    if (stored === 'dark' || stored === 'light') theme = stored;
  } catch (_) { /* local file storage may be denied; the current page still works. */ }
  apply(theme);
  document.documentElement.lang = brand.language || 'en';
  // Standalone generated pages already declare their own title and description.
  var staticMeta = document.documentElement.hasAttribute('data-static-meta');
  if (!staticMeta && brand.product) document.title = brand.product + (brand.tagline ? ' — ' + brand.tagline : '');
  var meta = document.querySelector('meta[name="description"]');
  if (!staticMeta && meta && brand.description) meta.content = brand.description;
  var favicon = document.getElementById('site-favicon');
  if (favicon && brand.favicon) favicon.href = brand.favicon;
  // Keep the production domain in site-config.js instead of repeating it in HTML shells.
  if (cfg.links && cfg.links.official && !document.querySelector('link[rel="canonical"]')) {
    var canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = cfg.links.official.replace(/\/?$/, '/') + (location.pathname.endsWith('/reference.html') ? 'reference.html' : '');
    document.head.appendChild(canonical);
  }
  window.COREX_APPLY_THEME = apply;
}());
