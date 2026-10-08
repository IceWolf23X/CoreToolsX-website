// Build the offline full reference with shared rendering and public privacy navigation.
(function () {
  'use strict';
  var site=window.COREX_SITE,docs=window.COREX_DOCS,ui=window.COREX_UI,E=window.CCX_UTILS.escapeHTML;
  function icon(name){return '<svg class="icon" aria-hidden="true"><use href="#i-'+name+'"></use></svg>';}
  function brand(){var name=site.brand.product,core=name.endsWith('X')?name.slice(0,-1):name,x=name.endsWith('X')?'<span class="brand-x">X</span>':'';return '<a class="brand" href="index.html" aria-label="'+E(name)+' home"><img src="'+E(site.brand.logo)+'" alt="" width="28" height="28"><span>'+E(core)+x+'</span></a>';}
  function article(a){return '<section class="reference-article" data-article-id="'+E(a.id)+'"><header class="reference-article-head"><span class="eyebrow">'+E(a.id)+'</span><h2>'+E(a.title)+'</h2><p>'+E(a.description)+'</p></header><div class="prose reference-article-body">'+a.bodyHtml+'</div></section>';}
  var html='<header class="site-header reference-header"><div class="header-inner">'+brand()+'<div class="header-actions"><a class="button ghost" href="index.html#/docs/overview">'+icon('arrow-left')+'Documentation</a><button class="icon-button theme-toggle" type="button" data-theme-toggle aria-label="'+E(ui.theme.toDark)+'">'+icon('sun')+icon('moon')+'</button></div></div></header>'+
    '<main class="static-reference prose" id="reference-main"><header class="reference-title"><p class="eyebrow">Complete documentation snapshot</p><h1>'+E(site.brand.product)+' reference</h1><p>All documentation articles and synchronized configuration defaults in one local page.</p></header>'+docs.articles.map(article).join('')+'</main>'+
    (ui.legal ? '<footer class="container legal-reference-footer"><a data-legal-link href="'+E(ui.legal.href)+'">'+E(ui.legal.label)+'</a></footer>' : '')+
    '<div class="toast" id="toast" role="status" aria-live="polite"></div>';
  document.getElementById('app-root').innerHTML=html;
  window.COREX_CONFIG_VIEW.renderMounts(document.getElementById('reference-main'));
  if(window.COREX_HIGHLIGHT)window.COREX_HIGHLIGHT.render(document.getElementById('reference-main'));

  function applyTheme(theme){document.documentElement.dataset.theme=theme;if(window.COREX_APPLY_THEME)window.COREX_APPLY_THEME(theme);document.querySelectorAll('[data-theme-toggle]').forEach(function(b){var dark=theme==='dark';b.setAttribute('aria-label',dark?ui.theme.toLight:ui.theme.toDark);b.setAttribute('aria-pressed',String(dark));});}
  document.querySelectorAll('[data-theme-toggle]').forEach(function(b){b.addEventListener('click',function(){var t=document.documentElement.dataset.theme==='dark'?'light':'dark';applyTheme(t);try{localStorage.setItem(site.theme.storageKey,t);}catch(_){}});});
  applyTheme(document.documentElement.dataset.theme||site.theme.default||'light');

  async function copy(text){try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(text);return true;}}catch(_){}var ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;left:-10000px';document.body.appendChild(ta);ta.select();var ok=false;try{ok=document.execCommand('copy');}catch(_){}ta.remove();return ok;}
  document.addEventListener('click',async function(e){var c=e.target.closest('.copy-code');if(c){var code=c.closest('.code-block').querySelector('code');c.textContent=(await copy(code.textContent))?ui.code.copied:ui.code.select;setTimeout(function(){if(c.isConnected)c.textContent=ui.code.copy;},1500);return;}var ex=e.target.closest('.expand-code');if(ex){var block=ex.closest('.code-block'),open=block.classList.toggle('is-expanded');ex.setAttribute('aria-expanded',String(open));ex.textContent=open?ui.code.collapse:ui.code.expand;}});
  document.title=site.brand.product+' — Full reference';
}());
