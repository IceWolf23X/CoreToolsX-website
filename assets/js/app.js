(function () {
  'use strict';
  var U=window.CCX_UTILS,site=window.COREX_SITE,ui=window.COREX_UI,landingContent=window.COREX_LANDING;
  var lastView=null,lastID=null,toastTimer=null;
  var landing=document.getElementById('landing-view'),docs=document.getElementById('docs-view'),releases=document.getElementById('releases-view');
  var sidebar=document.getElementById('docs-sidebar'),overlay=document.getElementById('sidebar-overlay');
  var nav=document.getElementById('header-nav');
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');

  function notify(text){
    var el=document.getElementById('toast');el.textContent=text;el.classList.add('visible');
    clearTimeout(toastTimer);toastTimer=setTimeout(function(){el.classList.remove('visible');},2200);
  }
  function closeMenu(){
    nav.classList.remove('is-open');
    var button=document.querySelector('[data-menu-toggle]');if(button)button.setAttribute('aria-expanded','false');
  }
  function mobile(){return window.matchMedia('(max-width:800px)').matches;}
  function closeSidebar(restore){
    var wasOpen=sidebar.classList.contains('is-open');
    sidebar.classList.remove('is-open');overlay.classList.remove('is-open');document.body.classList.remove('lock-scroll');
    sidebar.inert=mobile();
    document.querySelectorAll('[data-sidebar-toggle]').forEach(function(b){b.setAttribute('aria-expanded','false');});
    if(wasOpen&&restore!==false){var b=document.querySelector('[data-sidebar-toggle]');if(b)b.focus({preventScroll:true});}
  }
  function openSidebar(){
    closeMenu();sidebar.inert=false;sidebar.classList.add('is-open');overlay.classList.add('is-open');document.body.classList.add('lock-scroll');
    document.querySelectorAll('[data-sidebar-toggle]').forEach(function(b){b.setAttribute('aria-expanded','true');});
    var close=sidebar.querySelector('[data-sidebar-close]');if(close)close.focus({preventScroll:true});
  }
  function themeStorageKey(){return site.theme&&site.theme.storageKey||'corex.theme';}
  function syncTheme(){
    var dark=document.documentElement.dataset.theme==='dark';
    var label=dark?ui.theme.toLight:ui.theme.toDark;
    document.querySelectorAll('[data-theme-toggle]').forEach(function(b){b.setAttribute('aria-label',label);b.title=label;b.setAttribute('aria-pressed',String(dark));});
    var palette=site.theme&&site.theme[dark?'dark':'light'];
    var themeMeta=document.querySelector('meta[name="theme-color"]');if(themeMeta)themeMeta.content=palette&&palette.page?palette.page:(dark?'#17171a':'#fcfcfb');
  }
  document.querySelectorAll('[data-theme-toggle]').forEach(function(b){b.addEventListener('click',function(){
    var theme=document.documentElement.dataset.theme==='dark'?'light':'dark';
    document.documentElement.dataset.theme=theme;
    if(window.COREX_APPLY_THEME)window.COREX_APPLY_THEME(theme);
    try{localStorage.setItem(themeStorageKey(),theme);}catch(_){/* local file privacy mode may deny storage. */}
    syncTheme();
  });});
  window.addEventListener('storage',function(e){if(e.key===themeStorageKey()&&['light','dark'].indexOf(e.newValue)!==-1){document.documentElement.dataset.theme=e.newValue;if(window.COREX_APPLY_THEME)window.COREX_APPLY_THEME(e.newValue);syncTheme();}});
  syncTheme();

  document.querySelectorAll('[data-link]').forEach(function(a){var href=site.links[a.dataset.link];if(href)a.href=href;});

  function scrollRoute(route,initial){
    requestAnimationFrame(function(){
      var scope=route.view==='docs'?document.getElementById('article-body'):(route.view==='releases'?releases:landing);
      var target=route.anchor&&scope?Array.from(scope.querySelectorAll('[id]')).find(function(el){return el.id===route.anchor;}):null;
      if(target)target.scrollIntoView({behavior:reduced.matches||initial?'instant':'smooth',block:'start'});
      else window.scrollTo({top:0,behavior:'instant'});
    });
  }
  function renderRoute(initial){
    var r=U.routeParts(location.hash),same=r.view===lastView&&r.id===lastID;
    var isDocs=r.view==='docs',isReleases=r.view==='releases';landing.hidden=isDocs||isReleases;docs.hidden=!isDocs;releases.hidden=!isReleases;document.body.classList.toggle('docs-active',isDocs);
    closeMenu();closeSidebar(false);
    if(window.COREX_PREVIEW)window.COREX_PREVIEW.setActive(!isDocs&&!isReleases);
    if(isDocs&&!same)window.CCX_DOCS.render(r.id);
    if(isReleases&&(!same||initial))window.COREX_RELEASES_UI.render(r.id);
    if(!isDocs&&!isReleases)document.title=site.brand.product+' — '+site.brand.tagline;
    document.querySelectorAll('[data-nav]').forEach(function(a){
      var active=a.dataset.nav===(isDocs?'docs':(isReleases?'releases':r.anchor));
      a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
    });
    lastView=r.view;lastID=r.id;scrollRoute(r,initial);
    if(isDocs&&!same&&!initial)document.getElementById('article-title').focus({preventScroll:true});
  }
  function navigate(hash){if(location.hash===hash)renderRoute(false);else location.hash=hash;}
  window.CCX={navigate:navigate,notify:notify,closeSidebar:closeSidebar,openSearch:function(){window.CCX_SEARCH.open();}};
  window.addEventListener('hashchange',function(){renderRoute(false);});

  var menuToggle=document.querySelector('[data-menu-toggle]');
  if(menuToggle)menuToggle.addEventListener('click',function(){var open=nav.classList.toggle('is-open');this.setAttribute('aria-expanded',String(open));});
  document.querySelectorAll('[data-sidebar-toggle]').forEach(function(b){b.addEventListener('click',openSidebar);});
  document.querySelectorAll('[data-sidebar-close]').forEach(function(b){b.addEventListener('click',function(){closeSidebar();});});
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){closeMenu();closeSidebar();}
    if(e.key==='Tab'&&sidebar.classList.contains('is-open')){
      var focusable=Array.from(sidebar.querySelectorAll('a,button,summary')).filter(function(el){return el.getClientRects().length;});
      var first=focusable[0],last=focusable[focusable.length-1];
      if(first&&last&&e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      if(first&&last&&!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  });
  window.addEventListener('resize',function(){sidebar.inert=mobile()&&!sidebar.classList.contains('is-open');if(!mobile())closeSidebar(false);});
  var skip=document.querySelector('[data-skip]');if(skip)skip.addEventListener('click',function(e){e.preventDefault();var el=document.getElementById(!docs.hidden?'docs-main':(!releases.hidden?'releases-main':'landing-main'));el.focus();el.scrollIntoView();});

  var modes=(landingContent.setup&&landingContent.setup.modes)||[];
  function setSetup(value,focus){
    document.querySelectorAll('[data-setup]').forEach(function(b){var selected=b.dataset.setup===value;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;if(selected&&focus)b.focus();});
    modes.forEach(function(mode){var panel=document.getElementById('setup-'+mode.id);if(panel)panel.hidden=mode.id!==value;});
  }
  document.querySelectorAll('[data-setup]').forEach(function(b){
    b.addEventListener('click',function(){setSetup(b.dataset.setup,false);});
    b.addEventListener('keydown',function(e){
      if(['ArrowLeft','ArrowRight','Home','End'].indexOf(e.key)===-1)return;
      e.preventDefault();var current=modes.findIndex(function(m){return m.id===b.dataset.setup;}),next=current;
      if(e.key==='Home')next=0;else if(e.key==='End')next=modes.length-1;else if(e.key==='ArrowRight')next=(current+1)%modes.length;else next=(current-1+modes.length)%modes.length;
      if(modes[next])setSetup(modes[next].id,true);
    });
  });

  async function copy(text){
    try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(text);return true;}}catch(_){/* Try local-file fallback. */}
    var el=document.createElement('textarea');el.value=text;el.style.cssText='position:fixed;top:0;left:-10000px;width:1px;height:1px;';el.setAttribute('readonly','');document.body.appendChild(el);el.select();
    var ok=false;try{ok=document.execCommand('copy');}catch(_){}el.remove();return ok;
  }
  document.addEventListener('click',async function(e){
    var checksumButton=e.target.closest('[data-copy-checksum]');
    if(checksumButton){var checksumOk=await copy(checksumButton.dataset.copyChecksum||'');notify(checksumOk?ui.releases.copied:'Copy unavailable.');return;}
    var copyButton=e.target.closest('.copy-code');
    if(copyButton){
      var code=copyButton.closest('.code-block').querySelector('pre code');var success=await copy(code.textContent);
      copyButton.textContent=success?ui.code.copied:ui.code.select;
      if(!success){var selection=getSelection(),range=document.createRange();range.selectNodeContents(code);selection.removeAllRanges();selection.addRange(range);notify(ui.code.selectedNotice);}
      setTimeout(function(){if(copyButton.isConnected)copyButton.textContent=ui.code.copy;},1800);return;
    }
    var expand=e.target.closest('.expand-code');
    if(expand){var block=expand.closest('.code-block'),open=block.classList.toggle('is-expanded');expand.setAttribute('aria-expanded',String(open));expand.textContent=open?ui.code.collapse:ui.code.expand;return;}
    if(e.target.closest('[data-copy-article]')){notify(await copy(window.CCX_DOCS.text())?'Page text copied.':'Copy unavailable.');return;}
    if(e.target.closest('[data-print]')){window.print();return;}
    var link=e.target.closest('a[href^="#/"]');if(link&&link.getAttribute('href')===location.hash){e.preventDefault();renderRoute(false);}
  });

  var previewKey=landingContent.hero&&landingContent.hero.preview&&landingContent.hero.preview.assetKey;
  var preview=site.assets&&site.assets[previewKey||'heroPreview'];
  if(window.COREX_GALLERY){
    window.COREX_PREVIEW=window.COREX_GALLERY.mount(document.getElementById('chat-preview'),preview,ui.gallery);
  }
  if('IntersectionObserver' in window&&!reduced.matches){
    document.body.classList.add('motion-ready');
    var reveals=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.remove('pending');reveals.unobserve(entry.target);}});},{threshold:.05});
    document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('pending');reveals.observe(el);});
  }
  renderRoute(true);
}());
