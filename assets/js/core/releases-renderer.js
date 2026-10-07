/* The existing release page, with a lazily loaded public GitHub data source. */
(function () {
  'use strict';
  var site = window.COREX_SITE, ui = window.COREX_UI.releases, U = window.CCX_UTILS, E = U.escapeHTML;
  var provider = window.COREX_GITHUB_RELEASES, client = null;
  function icon(name) {return window.COREX_RENDERER.icon(name);}
  function formatBytes(n) {if (!Number.isFinite(n) || n < 1) return '0 B'; var units=['B','KB','MB','GB'], i=Math.min(Math.floor(Math.log(n)/Math.log(1024)),3); return (n/Math.pow(1024,i)).toFixed(i?1:0)+' '+units[i];}
  function label(channel) {return ui[channel] || channel;}
  function date(value) {try {return new Date(value).toLocaleString(site.brand.language || 'en', {dateStyle:'medium',timeStyle:'short'});} catch (_) {return '';}}
  function githubURL() {try {return provider.repoURL(site.releases);} catch (_) {return '';}}
  function githubLink() {var url=githubURL(); return url ? '<a class="button small" data-releases-github href="'+E(url)+'" target="_blank" rel="noopener noreferrer">'+icon('github')+E(ui.github)+'</a>' : '';}
  function fileCard(file, platform, button) {
    if (!file || !file.exists) return '';
    var checksum = file.sha256 ? '<button class="checksum-button" type="button" data-copy-checksum="'+E(file.sha256)+'" title="'+E(ui.copyChecksum)+'">'+icon('copy')+'<span>'+E(ui.checksum)+'</span></button>' : '';
    return '<article class="release-file"><div class="release-file-icon">'+icon(platform===ui.paper?'server':'network')+'</div><div class="release-file-copy"><span>'+E(platform)+'</span><strong title="'+E(file.downloadName)+'">'+E(file.downloadName)+'</strong><small>'+E(ui.size)+': '+E(formatBytes(file.size))+'</small></div><div class="release-file-actions">'+checksum+'<a class="button primary small" href="'+E(file.path)+'" rel="noreferrer">'+E(button)+icon('download')+'</a></div>'+(file.sha256?'<code class="release-checksum">'+E(file.sha256)+'</code>':'<small class="release-digest-unavailable">'+E(ui.checksumUnavailable)+'</small>')+'</article>';
  }
  function list(records, selected, recommended) {
    return '<aside class="release-list" aria-label="'+E(ui.releasedBuilds)+'"><p class="release-list-title">'+E(ui.releasedBuilds)+'</p>'+records.map(function (r) {
      return '<a class="release-list-item'+(r.version===selected?' active':'')+'"'+(r.version===selected?' aria-current="page"':'')+' href="#/releases/'+encodeURIComponent(r.version)+'"><span><strong>'+E(r.version)+'</strong><small>'+E(label(r.channel))+'</small></span>'+(r===recommended&&r.channel==='stable'?'<em>'+E(ui.latest)+'</em>':'')+'</a>';
    }).join('')+'</aside>';
  }
  function statusBar(state) {
    var message=state.status==='loading'?ui.refreshing:state.source==='live'?ui.sourceLive:state.source==='cache'?ui.sourceCache:ui.sourceSnapshot;
    if (state.error) {
      message=state.error.kind==='rateLimit'?ui.rateLimit:state.error.kind==='notFound'?ui.repositoryError:state.error.kind==='pagination'?ui.paginationError:state.releases.length?ui.networkError:ui.emptyError;
    }
    return '<div class="release-status" data-status="'+E(state.status)+'"><div role="status" aria-live="polite"><p>'+E(message)+'</p>'+(state.updatedAt?'<small>'+E(ui.updated)+': '+E(date(state.updatedAt))+'</small>':'')+(state.error&&state.retryAt>Date.now()?'<small>'+E(ui.retryAfter)+': '+E(date(state.retryAt))+'</small>':'')+'</div><div class="release-status-actions"><button class="button small" type="button" data-releases-refresh'+(state.status==='loading'?' disabled':'')+'>'+E(ui.refresh)+'</button>'+githubLink()+'</div></div>';
  }
  function empty(title,text,home) {
    return '<section class="release-empty"><div>'+icon('box')+'</div><h2>'+E(title)+'</h2><p>'+E(text)+'</p>'+(home?'<a class="button" href="#/releases">'+E(ui.backToReleases)+'</a>':site.links.modrinth?'<a class="button" href="'+E(site.links.modrinth)+'" target="_blank" rel="noopener noreferrer">'+E(ui.modrinthFallback)+icon('external')+'</a>':'')+'</section>';
  }
  function paint(version) {
    var root=document.getElementById('releases-root'); if (!root) return;
    var state=client.getState(), records=state.releases;
    var focusRefresh=document.activeElement && document.activeElement.hasAttribute('data-releases-refresh');
    var hero='<header class="release-hero"><p class="eyebrow"><span class="dot"></span>'+E(ui.eyebrow)+'</p><h1>'+E(ui.title)+'</h1><p>'+E(ui.description)+'</p></header>';
    var content=hero+statusBar(state);
    var recommended=records.find(function(r){return r.channel==='stable';}) || records[0];
    var selected=version?records.find(function(r){return r.version===version;}):recommended;
    document.title=site.brand.product+' — '+ui.pageTitle;
    if (!records.length) {
      var waiting=state.status==='loading'||state.status==='idle';
      content+=empty(waiting?ui.loadingTitle:state.error?ui.unavailableTitle:ui.noReleasesTitle,waiting?ui.loadingText:state.error?ui.unavailableText:ui.noReleasesText);
    } else if (!selected) {
      content+='<div class="release-layout">'+list(records,'',recommended)+empty(state.status==='loading'?ui.loadingTitle:ui.notFoundTitle,state.status==='loading'?ui.loadingText:ui.notFoundText,true)+'</div>';
    } else {
      var r=selected;
      var detail='<section class="release-detail"><a class="release-back" href="#/releases">'+icon('arrow-left')+E(ui.backToReleases)+'</a><div class="release-version-line"><h2>'+E(r.version)+'</h2><span class="release-channel '+E(r.channel)+'">'+E(label(r.channel))+'</span>'+(r===recommended&&r.channel==='stable'?'<span class="release-latest">'+E(ui.latest)+'</span>':'')+'</div>';
      detail+='<p class="release-name">'+E(r.title)+'</p><p class="release-date">'+E(ui.published)+' <time datetime="'+E(r.publishedAt)+'">'+E(date(r.publishedAt))+'</time></p>';
      detail+='<div class="release-files">'+fileCard(r.paper,ui.paper,ui.downloadPaper)+fileCard(r.velocity,ui.velocity,ui.downloadVelocity)+'</div><p class="release-online-note">'+E(ui.onlineDownloads)+'</p>';
      detail+='<section class="release-changelog"><div class="release-changelog-title"><span>'+icon('file')+E(ui.changelog)+'</span><a href="'+E(r.url)+'" target="_blank" rel="noopener noreferrer">'+E(ui.changelogSource)+'</a></div><div class="release-markdown">'+(r.changelogHtml||'<p class="release-no-changelog">'+E(ui.noChangelog)+'</p>')+'</div></section></section>';
      content+='<div class="release-layout">'+list(records,r.version,recommended)+detail+'</div>';
      document.title=site.brand.product+' '+r.version+' — '+ui.downloadTitle;
    }
    if (state.warnings.length) content+='<p class="release-warning">'+E(ui.assetWarning)+'</p>';
    root.innerHTML=content;
    if (focusRefresh) {var button=root.querySelector('[data-releases-refresh]'); if (button) button.focus({preventScroll:true});}
  }
  function ensureClient() {
    if (client) return;
    var storage=null; try {storage=window.localStorage;} catch (_) { /* Optional for local/offline rendering. */ }
    client=provider.createClient(site.releases,{snapshot:window.COREX_RELEASES,storage:storage});
    client.subscribe(function () {var route=U.routeParts(location.hash); if (route.view==='releases') paint(route.id);});
  }
  function render(version) {
    try {ensureClient(); paint(version); client.load();}
    catch (_) {document.getElementById('releases-root').innerHTML=empty(ui.unavailableTitle,ui.configurationError);}
  }
  document.addEventListener('click',function (event) {
    if (event.target.closest('[data-releases-refresh]') && client) client.load({force:true});
  });
  window.COREX_RELEASES_UI={render:render,formatBytes:formatBytes,getState:function(){return client&&client.getState();}};
}());
