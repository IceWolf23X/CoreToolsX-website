(function () {
  'use strict';
  var site = window.COREX_SITE, content = window.COREX_LANDING, ui = window.COREX_UI, U = window.CCX_UTILS;
  var E = U.escapeHTML;

  /** Render the optional public legal link using shared interface data. */
  function legalLink() {
    return ui.legal ? '<a data-legal-link href="' + E(ui.legal.href) + '">' + E(ui.legal.label) + '</a>' : '';
  }

  function icon(name, extra) {
    return '<svg class="icon ' + (extra || '') + '" aria-hidden="true"><use href="#i-' + E(name) + '"></use></svg>';
  }
  function brand() {
    var name = site.brand.product || 'CoreX';
    var label = name.endsWith('X') ? E(name.slice(0, -1)) + '<span class="brand-x">X</span>' : E(name);
    return '<a class="brand" href="#/" aria-label="' + E(name) + ' home"><img src="' + E(site.brand.logo) + '" width="34" height="34" alt=""><span>' + label + '</span></a>';
  }
  function href(item) { return item.linkKey ? site.links[item.linkKey] : item.href; }
  function linkAttrs(item) {
    var out = ' href="' + E(href(item) || '#') + '"';
    if (item.linkKey) out += ' data-link="' + E(item.linkKey) + '"';
    if (item.docsLink) out += ' data-docs-link';
    if (item.nav) out += ' data-nav="' + E(item.nav) + '"';
    if (item.external) out += ' target="_blank" rel="noopener noreferrer"';
    return out;
  }
  function action(item) {
    var classes = 'button' + (item.style ? ' ' + E(item.style) : '');
    var before = item.icon && item.icon === 'book' ? icon(item.icon) : '';
    var after = item.icon && item.icon !== 'book' ? icon(item.icon) : '';
    return '<a class="' + classes + '"' + linkAttrs(item) + '>' + before + E(item.label) + after + '</a>';
  }
  function textLink(item) {
    return '<a class="text-link"' + linkAttrs(item) + '>' + E(item.label) + icon('arrow') + '</a>';
  }
  function titleLines(lines, id, accentSupported) {
    var body = (lines || []).map(function (line) {
      var cls = accentSupported && line.accent ? ' class="accent"' : '';
      return '<span' + cls + '>' + E(typeof line === 'string' ? line : line.text) + '</span>';
    }).join('');
    return '<h1' + (id ? ' id="' + E(id) + '"' : '') + '>' + body + '</h1>';
  }
  function h2Lines(lines, id) {
    return '<h2' + (id ? ' id="' + E(id) + '"' : '') + '>' + (lines || []).map(E).join('<br>') + '</h2>';
  }

  function renderHeader() {
    var nav = content.header.nav.map(function (item) {
      return '<a' + linkAttrs(item) + '>' + E(item.label) + '</a>';
    }).join('');
    return '<header class="site-header"><div class="header-inner">' + brand() +
      '<span class="family-label">' + E(site.brand.familyLabel) + '</span>' +
      '<nav class="header-nav" id="header-nav" aria-label="Main navigation">' + nav + '</nav>' +
      '<div class="header-actions">' +
      '<button class="icon-button header-search" data-search-open aria-label="' + E(ui.header.searchLabel) + '" title="' + E(ui.header.searchTitle) + '">' + icon('search') + '</button>' +
      '<button class="icon-button" data-theme-toggle aria-label="' + E(ui.theme.toDark) + '" title="' + E(ui.theme.switchTitle) + '">' + icon('moon','theme-moon') + icon('sun','theme-sun') + '</button>' +
      '<span class="header-divider" aria-hidden="true"></span>' +
      '<a class="button dark small" data-link="download" href="' + E(site.links.download) + '">' + E(ui.header.download) + icon('download') + '</a>' +
      '<button class="icon-button menu-toggle" data-menu-toggle aria-label="' + E(ui.header.menuOpen) + '" aria-expanded="false" aria-controls="header-nav">' + icon('menu') + '</button>' +
      '</div></div></header>';
  }

  function renderHero(s) {
    var platforms = s.platforms.map(function (p, i) {
      return (i ? '<span class="separator"></span>' : '') + '<span>' + icon('check') + E(p) + '</span>';
    }).join('');
    var p = s.preview;
    return '<section class="hero container" aria-labelledby="hero-title"><div class="hero-grid">' +
      '<div class="hero-copy"><p class="eyebrow"><span class="dot"></span>' + E(s.eyebrow) + '</p>' +
      titleLines(s.title,'hero-title',true) + '<p class="hero-description">' + E(s.description) + '</p>' +
      '<div class="hero-ctas">' + s.actions.map(action).join('') + '</div><div class="hero-platforms">' + platforms + '</div></div>' +
      '<div class="preview-shell" aria-label="' + E(p.ariaLabel) + '"><div class="preview-top"><span>' + E(p.topLeft) + '</span><span class="preview-dots" aria-hidden="true"><i></i><i></i><i></i></span></div>' +
      '<div class="preview-canvas" id="chat-preview"><span class="capture-label">' + E(p.placeholderLabel) + '</span><span class="capture-corner tl"></span><span class="capture-corner br"></span>' +
      '<div class="preview-placeholder">' + icon('image') + '<strong>' + E(p.placeholderTitle) + '</strong><p>' + E(p.placeholderText) + '</p></div><span class="capture-dimensions">' + E(p.dimensions) + '</span></div>' +
      '<div class="preview-caption"><span>' + icon('image') + '<span data-preview-caption-text>' + E(p.captionLeft) + '</span></span><span>' + E(p.captionRight) + '</span></div><div class="preview-tag">' + icon('layers') + E(p.tag) + '</div></div>' +
      '</div></section>';
  }

  /** Render declared integrations with readable labels when mobile hides line breaks. */
  function renderCompatibility(s) {
    return '<div class="compatibility-strip"><div class="container compatibility-inner"><p>' + s.labelLines.map(E).join(' <br>') + '</p><div class="integrations">' +
      s.items.map(function (item) { return '<span class="integration">' + icon(item.icon) + E(item.label) + '</span>'; }).join('') +
      '</div></div></div>';
  }

  function renderFeatures(s) {
    var cards = s.cards.map(function (c) {
      return '<article class="feature-card reveal"><div class="feature-icon">' + icon(c.icon) + '</div><h3>' + E(c.title) + '</h3><p>' + E(c.text) + '</p>' + textLink(c.link) + '</article>';
    }).join('');
    return '<section class="section container" id="' + E(s.id) + '" aria-labelledby="features-title"><div class="section-heading reveal"><div><p class="eyebrow"><span class="section-number">' + E(s.number) + '</span>' + E(s.eyebrow) + '</p>' + h2Lines(s.title,'features-title') + '</div><p>' + E(s.description) + '</p></div>' +
      '<div class="feature-grid">' + cards + '</div><div class="features-bottom reveal"><p><strong>' + E(s.bottom.strong) + '</strong> ' + E(s.bottom.text) + '</p>' + textLink(s.bottom.link) + '</div></section>';
  }

  function topology(t) {
    var parts=[];
    t.nodes.forEach(function (n, i) {
      if (i) parts.push('<span class="topology-connector"></span>');
      if (n.group) {
        parts.push('<div class="topology-group">' + n.group.map(function (g) { return '<div class="topology-node">' + icon(g.icon) + E(g.label) + '</div>'; }).join('') + '</div>');
      } else {
        parts.push('<div class="topology-node' + (n.primary ? ' primary-node' : '') + '">' + icon(n.icon) + E(n.label) + (n.small ? '<small>' + E(n.small) + '</small>' : '') + '</div>');
      }
    });
    return '<div class="topology"><div class="topology-label"><span>' + E(t.labelLeft) + '</span><span>' + E(t.labelRight) + '</span></div><div class="topology-map">' + parts.join('') + '</div><p class="topology-note">' + icon('info') + E(t.note) + '</p></div>';
  }

  function renderSetup(s) {
    var tabs = s.modes.map(function (m, i) {
      return '<button id="tab-' + E(m.id) + '" role="tab" aria-selected="' + String(i===0) + '" aria-controls="setup-' + E(m.id) + '" data-setup="' + E(m.id) + '"' + (i ? ' tabindex="-1"' : '') + '>' + icon(m.tabIcon) + E(m.tabLabel) + '</button>';
    }).join('');
    var panels = s.modes.map(function (m, i) {
      return '<div class="setup-panel" id="setup-' + E(m.id) + '" role="tabpanel" aria-labelledby="tab-' + E(m.id) + '"' + (i ? ' hidden' : '') + '><div class="setup-copy"><h3>' + E(m.title) + '</h3><p>' + E(m.text) + '</p><ol class="setup-steps">' +
        m.steps.map(function (step, idx) { return '<li><span>' + (idx+1) + '</span>' + E(step) + '</li>'; }).join('') + '</ol>' + textLink(m.link) + '</div>' + topology(m.topology) + '</div>';
    }).join('');
    return '<section class="section setup-section" id="' + E(s.id) + '" aria-labelledby="setup-title"><div class="container"><div class="setup-intro reveal"><div><p class="eyebrow"><span class="section-number">' + E(s.number) + '</span>' + E(s.eyebrow) + '</p>' + h2Lines(s.title,'setup-title') + '</div><div class="setup-tabs" role="tablist" aria-label="' + E(s.tabAriaLabel) + '">' + tabs + '</div></div>' + panels + '</div></section>';
  }

  function renderBridges(s) {
    return '<section class="section container bridge-section" aria-labelledby="bridges-title"><div class="reveal"><p class="eyebrow"><span class="section-number">' + E(s.number) + '</span>' + E(s.eyebrow) + '</p>' + h2Lines(s.title,'bridges-title') + '<p>' + E(s.description) + '</p><p class="bridge-disclosure">' + E(s.disclosure) + '</p></div><div class="bridge-pair">' +
      s.cards.map(function(c){return '<article class="bridge-card reveal">'+icon(c.icon)+'<h3>'+E(c.title)+'</h3><p>'+E(c.text)+'</p>'+textLink(c.link)+'</article>';}).join('') + '</div></section>';
  }

  function renderDocsPromo(s) {
    return '<section class="container docs-promo reveal" aria-labelledby="docs-promo-title"><div><p class="eyebrow"><span class="dot"></span>' + E(s.eyebrow) + '</p>' + h2Lines(s.title,'docs-promo-title') + '<p>' + E(s.description) + '</p></div><div class="docs-promo-links">' +
      s.cards.map(function(c){return '<a class="docs-promo-card" href="'+E(c.href)+'">'+icon(c.icon)+icon('arrow','arrow')+'<h3>'+E(c.title)+'</h3><p>'+E(c.text)+'</p></a>';}).join('') + '</div></section>';
  }

  function renderFaq(s) {
    return '<section class="section container faq-section" id="' + E(s.id) + '" aria-labelledby="faq-title"><div class="faq-heading reveal"><p class="eyebrow"><span class="section-number">' + E(s.number) + '</span>' + E(s.eyebrow) + '</p><h2 id="faq-title">' + E(s.title) + '</h2><p>' + E(s.description) + '</p>' + textLink(s.introLink) + '</div><div class="faq-list">' +
      s.items.map(function(q){return '<details><summary>'+E(q.question)+'</summary><div>'+E(q.answer)+'<br>'+textLink(q.link)+'</div></details>';}).join('') + '</div></section>';
  }

  function renderFinalCta(s) {
    return '<section class="container final-cta reveal"><div>' + h2Lines(s.title) + '<p>' + E(s.description) + '</p></div><div class="hero-ctas">' + s.actions.map(action).join('') + '</div></section>';
  }

  function renderLanding() {
    var renderers={hero:renderHero,compatibility:renderCompatibility,features:renderFeatures,setup:renderSetup,bridges:renderBridges,docsPromo:renderDocsPromo,faq:renderFaq,finalCta:renderFinalCta};
    var sections=content.order.map(function(key){return renderers[key](content[key]);}).join('');
    return '<div id="landing-view"><main id="landing-main" tabindex="-1">' + sections + '</main>' + renderFooter() + '</div>';
  }

  // Render shared footer navigation, the privacy notice and documentation-scope link.
  function renderFooter() {
    var f=content.footer;
    return '<footer class="site-footer"><div class="container"><div class="footer-main"><div>' + brand() + '<p class="footer-caption">' + E(f.caption) + '</p></div><nav class="footer-nav" aria-label="Footer">' +
      f.nav.map(function(n){return '<a'+linkAttrs(n)+'>'+E(n.label)+'</a>';}).join('') + legalLink() + '</nav></div><div class="footer-bottom"><span>' + E(f.copyright) + '</span><a href="' + E(f.scopeLink.href) + '">' + E(f.scopeLink.label) + '</a></div></div></footer>';
  }

  // Build wiki navigation, article tools and the documentation-scope/privacy controls.
  /** Render wiki navigation with product-owned scope, privacy and troubleshooting routes. */
  function renderDocsShell() {
    var d=ui.docs;
    return '<div id="docs-view" hidden><div class="docs-mobilebar"><button data-sidebar-toggle aria-controls="docs-sidebar" aria-expanded="false">' + icon('list') + E(d.mobileMenu) + '</button><button data-search-open aria-label="' + E(d.mobileSearch) + '">' + icon('search') + E(d.mobileSearch) + '</button></div><div class="docs-layout">' +
      '<aside class="docs-sidebar" id="docs-sidebar" aria-label="Documentation navigation"><div class="sidebar-top"><div class="sidebar-title"><span>' + icon('book') + E(d.sidebarTitle) + '</span><button class="icon-button sidebar-close" data-sidebar-close aria-label="Close documentation menu">' + icon('close') + '</button></div><button class="sidebar-search" data-search-open>' + icon('search') + E(d.sidebarSearch) + '<kbd>Ctrl K</kbd></button><div class="docs-mode-tabs"><a href="#/docs/overview" data-doc-mode="overview">' + E(d.overviewTab) + '</a><a href="#/docs/instructions" data-doc-mode="instructions">' + E(d.instructionsTab) + '</a></div></div><nav class="sidebar-scroll" id="sidebar-tree" aria-label="Article navigation"></nav><a class="sidebar-bottom" href="#/docs/' + E(window.COREX_DOCS.navigation.scope) + '">' + icon('file') + E(d.sidebarBottom) + icon('arrow') + '</a></aside>' +
      '<main class="docs-main" id="docs-main" tabindex="-1"><nav class="breadcrumbs" id="breadcrumbs" aria-label="Breadcrumb"></nav><header class="article-header"><div class="article-kicker" id="article-kicker"></div><h1 id="article-title" tabindex="-1"></h1><p class="article-description" id="article-description"></p><div class="article-tools" id="article-tools"></div></header><details class="mobile-toc" id="mobile-toc"><summary>' + icon('list') + E(d.onThisPage) + icon('chevron') + '</summary><nav class="toc-links" id="mobile-toc-links" aria-label="' + E(d.onThisPage) + '"></nav></details><div id="article-body"></div><nav class="article-pagination" id="article-pagination" aria-label="Previous and next articles"></nav><p class="docs-bottom-note"><span data-product-name></span> ' + E(d.bottomNote) + ' · <a href="#/docs/' + E(window.COREX_DOCS.navigation.scope) + '">' + E(d.scope) + '</a> · ' + legalLink() + '</p></main>' +
      '<aside class="toc-rail" aria-label="' + E(d.onThisPage) + '"><p class="toc-heading">' + icon('list') + E(d.onThisPage) + '</p><nav class="toc-links" id="toc-links"></nav><div class="toc-help"><p>' + E(d.helpText).replace(/\n/g,'<br>') + '</p><a href="#/docs/' + E(window.COREX_DOCS.navigation.troubleshooting) + '">' + icon('help') + E(d.troubleshooting) + '</a><a data-link="issues" href="' + E(site.links.issues) + '" target="_blank" rel="noopener noreferrer">' + icon('github') + E(d.reportIssue) + icon('external') + '</a><a href="reference.html">' + icon('book') + E(d.fullReference) + '</a></div></aside></div></div>';
  }


  function renderReleasesShell() {
    return '<div id="releases-view" hidden><main id="releases-main" tabindex="-1"><div class="container releases-page" id="releases-root"></div></main>' + renderFooter() + '</div>';
  }

  function renderSearch() {
    var s=ui.search;
    return '<dialog id="search-dialog" aria-labelledby="search-title"><h2 id="search-title" style="position:absolute;clip-path:inset(50%);width:1px;height:1px;overflow:hidden">' + E(s.title) + '</h2><div class="search-top">' + icon('search') + '<input id="search-input" type="search" autocomplete="off" spellcheck="false" placeholder="' + E(s.placeholder) + '" aria-label="' + E(s.ariaLabel) + '" aria-controls="search-results"><button class="icon-button" id="search-close" aria-label="' + E(s.close) + '">' + icon('close') + '</button></div><div class="search-body" id="search-results" aria-live="polite"></div><div class="search-footer"><span><kbd>↑</kbd> <kbd>↓</kbd> ' + E(s.navigate) + '</span><span><kbd>↵</kbd> ' + E(s.open) + '</span><span><kbd>Esc</kbd> ' + E(s.escape) + '</span><span>' + E(s.local) + '</span></div></dialog>';
  }

  var root=document.getElementById('app-root');
  root.innerHTML='<a href="#content" class="skip-link" data-skip>' + E(ui.skipToContent) + '</a>' + renderHeader() + renderLanding() + renderDocsShell() + renderReleasesShell() + '<button class="sidebar-overlay" id="sidebar-overlay" data-sidebar-close aria-label="Close documentation menu" tabindex="-1"></button>' + renderSearch() + '<div class="toast" id="toast" role="status" aria-live="polite"></div>';
  root.querySelectorAll('[data-product-name]').forEach(function(el){el.textContent=site.brand.product;});
  window.COREX_RENDERER={icon:icon};
}());
