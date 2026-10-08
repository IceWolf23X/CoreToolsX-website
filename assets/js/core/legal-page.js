/* Use the existing theme preference on the standalone notice, without adding storage or network services. */
(function () {
  'use strict';
  var button = document.querySelector('[data-legal-theme-toggle]');
  if (!button) return;
  /** Keep the accessible button label aligned with the currently applied theme. */
  function label() {
    var dark = document.documentElement.dataset.theme === 'dark';
    button.setAttribute('aria-label', dark ? button.dataset.toLight : button.dataset.toDark);
    button.setAttribute('aria-pressed', String(dark));
  }
  /** Apply an explicitly requested theme and save only the site's existing preference key. */
  function toggle() {
    var theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    if (window.COREX_APPLY_THEME) window.COREX_APPLY_THEME(theme);
    try { localStorage.setItem(window.COREX_SITE.theme.storageKey, theme); }
    catch (_) { /* The notice remains readable when browser storage is blocked. */ }
    label();
  }
  button.hidden = false;
  button.addEventListener('click', toggle);
  label();
}());
