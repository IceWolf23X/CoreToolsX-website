(function () {
  'use strict';
  var data = window.COREX_DOCS, U = window.CCX_UTILS, E = U.escapeHTML, ui = window.COREX_UI.docs;
  var articles = new Map(data.articles.map(function (a) { return [a.id, a]; }));
  var groups = new Map(data.groups.map(function (g) { return [g.id, g]; }));
  var observer = null, current = null;

  // Compatibility alias for older local tests/custom scripts. COREX_DOCS is the source of truth.
  window.CCX_CONTENT = data;

  function icon(name, extra) { return '<svg class="icon ' + (extra || '') + '" aria-hidden="true"><use href="#i-' + name + '"></use></svg>'; }
  function route(id, anchor) { return '#/docs/' + id + (anchor ? '~' + anchor : ''); }
  function readMinutes(a) {
    var tmp=document.createElement('div');tmp.innerHTML=a.bodyHtml || '';
    return Math.max(1,Math.ceil((tmp.textContent || '').trim().split(/\s+/).filter(Boolean).length/220));
  }
  // Render a category-specific article card without depending on document provenance.
  function card(a, compact) {
    return '<a class="doc-card" href="' + route(a.id) + '">' + icon(a.icon) + icon('arrow', 'card-arrow') +
      '<h3>' + E(a.title) + '</h3><p>' + E(a.description) + '</p>' +
      (!compact ? '<span class="doc-card-label">' + (a.group === 'overview' ? 'Read the overview' : 'Reference notes') + ' →</span>' : '') + '</a>';
  }
  function section(id, title, list, compact) {
    return '<section class="hub-section" id="' + id + '"><div class="hub-section-header"><h2>' + E(title) + '</h2><span>' + String(list.length).padStart(2,'0') + ' ARTICLES</span></div>' +
      '<div class="doc-card-grid' + (compact ? ' compact' : '') + '">' + list.map(function (a) { return card(a,compact); }).join('') + '</div></section>';
  }
  function sidebar(id) {
    var overview = id === 'overview' || id.indexOf('overview/') === 0;
    document.querySelectorAll('[data-doc-mode]').forEach(function (a) {
      a.classList.toggle('active', a.dataset.docMode === (overview ? 'overview':'instructions'));
      if (a.classList.contains('active')) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
    });
    var out = '<a class="sidebar-overview-link' + (id === 'overview' ? ' active':'') + '" href="#/docs/overview">' + icon('layers') + E(ui.overviewTab) + '</a>';
    out += '<a class="sidebar-overview-link' + (id === 'instructions' ? ' active':'') + '" href="#/docs/instructions">' + icon('code') + E(ui.instructionsTab) + '</a>';
    data.groups.forEach(function (g) {
      var items = data.articles.filter(function (a) { return a.group === g.id; });
      var active = items.some(function (a) { return a.id === id; });
      var open = active || g.id === 'getting-started' || g.id === 'paper' || (g.id === 'overview' && overview) || (g.id === 'velocity' && !overview);
      out += '<details class="sidebar-group"' + (open ? ' open':'') + '><summary>' + E(g.label) + icon('chevron') + '</summary>';
      items.forEach(function (a) {
        out += '<a class="nav-item' + (a.id === id ? ' active':'') + '" href="' + route(a.id) + '" title="' + E(a.title) + '"' + (a.id === id ? ' aria-current="page"':'') + '>' + icon(a.icon) + '<span>' + E(a.title) + '</span></a>';
      });
      out += '</details>';
    });
    document.getElementById('sidebar-tree').innerHTML = out;
    var activeLink = document.querySelector('.nav-item.active');
    if (activeLink) {
      var scroller = document.getElementById('sidebar-tree');
      scroller.scrollTop = Math.max(0, activeLink.offsetTop - scroller.offsetTop - 150);
    }
  }
  function tocFromBody() {
    return Array.from(document.querySelectorAll('#article-body h2[id], #article-body h3[id], #article-body .hub-section[id]')).map(function(h){
      var clone=h.cloneNode(true);clone.querySelectorAll('.heading-anchor').forEach(function(x){x.remove();});
      return {id:h.id,title:(clone.textContent||'').trim(),level:h.tagName==='H3'?3:2};
    });
  }
  function setTOC(entries,id) {
    var html = entries.length ? entries.map(function (e) {
      return '<a class="toc-link' + (e.level > 2 ? ' sub':'') + '" href="' + route(id,e.id) + '" data-toc-id="' + E(e.id) + '">' + E(e.title) + '</a>';
    }).join('') : '<a class="toc-link" href="' + route(id) + '">' + E(ui.tocIntroduction) + '</a>';
    document.getElementById('toc-links').innerHTML = html;
    document.getElementById('mobile-toc-links').innerHTML = html;
    document.getElementById('mobile-toc').open = false;
    if (observer) observer.disconnect();
    if (!('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver(function (items) {
      items.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        document.querySelectorAll('[data-toc-id]').forEach(function (a) { a.classList.toggle('active',a.dataset.tocId === entry.target.id); });
      });
    }, {rootMargin:'-115px 0px -68% 0px',threshold:0});
    document.querySelectorAll('#article-body h2[id], #article-body h3[id], #article-body .hub-section[id]').forEach(function (h) { observer.observe(h); });
  }
  // Populate article identity and the copy, print and maintained HTML-reference tools.
  function setHeading(title,description,group,minutes) {
    document.getElementById('article-title').textContent = title;
    document.getElementById('article-description').textContent = description;
    document.getElementById('article-kicker').innerHTML = '<span class="eyebrow">' + E(group) + '</span>' + (minutes ? '<span class="reading-time">· ' + minutes + ' min reference</span>':'');
    var t=ui.articleTools;
    var tools = '<button type="button" class="article-tool" data-copy-article>' + icon('copy') + E(t.copy) + '</button><button type="button" class="article-tool" data-print>' + icon('print') + E(t.print) + '</button>';
    tools += '<a class="article-tool reference-tool" href="reference.html">' + icon('book') + '<span>' + E(t.fullReference) + '</span></a>';
    document.getElementById('article-tools').innerHTML = tools;
    document.title = title + ' — ' + window.COREX_SITE.brand.product + ' Documentation';
  }
  // Build the overview or configuration directory from the maintained article data.
  function renderHub(id) {
    var isOverview = id === 'overview', h=isOverview?ui.hubs.overview:ui.hubs.instructions;
    setHeading(h.title,h.description,h.kicker,0);
    document.getElementById('breadcrumbs').innerHTML = '<a href="#/">Home</a>' + icon('chevron') + '<span>Documentation</span>' + icon('chevron') + '<span>' + E(h.kicker) + '</span>';
    var out='',toc=[];
    if (isOverview) {
      out = '<div class="hub-intro">' + icon('layers') + '<div><strong>' + E(h.introStrong) + '</strong><br>' + E(h.introText) + '</div></div>';
      data.hubs.overviewCategories.forEach(function (c) {
        var list=c.articles.map(function (s) {return articles.get('overview/'+s);}).filter(Boolean);
        out+=section(c.id,c.title,list,false);toc.push({id:c.id,title:c.title,level:2});
      });
    } else {
      // Pick actual setup articles from the catalog instead of fixed platform links.
      var starts = data.hubs.instructionStarts || data.articles.filter(function (a) { return a.group === 'getting-started'; }).slice(0, 2).map(function (a) { return a.id; });
      // Render only declared routes that exist in this product's catalog.
      out = '<div class="start-grid">' + starts.map(function (id) {
        var a = articles.get(id);
        return a ? '<a class="start-card" href="' + route(a.id) + '">' + icon(a.icon) + '<div><h3>' + E(a.title) + '</h3><p>' + E(a.description) + '</p></div></a>' : '';
      }).join('') + '</div>';
      data.groups.filter(function(g){return g.id!=='overview';}).forEach(function(g){
        var list=data.articles.filter(function(a){return a.group===g.id;});
        out+=section(g.id,g.label,list,g.id==='paper'||g.id==='velocity'||g.id==='runtime');
        toc.push({id:g.id,title:g.label,level:2});
      });
    }
    document.getElementById('article-body').className='hub-body';
    document.getElementById('article-body').innerHTML=out;
    document.getElementById('article-pagination').innerHTML='';
    setTOC(toc,id);
  }
  function pagination(a) {
    var i=data.articles.indexOf(a),p=data.articles[i-1],n=data.articles[i+1];
    document.getElementById('article-pagination').innerHTML=(p?'<a class="pagination-card" href="'+route(p.id)+'">'+icon('arrow-left')+'<div><span>'+E(ui.pagination.previous)+'</span><strong>'+E(p.title)+'</strong></div></a>':'<span></span>')+
      (n?'<a class="pagination-card next" href="'+route(n.id)+'"><div><span>'+E(ui.pagination.next)+'</span><strong>'+E(n.title)+'</strong></div>'+icon('arrow')+'</a>':'');
  }
  function arrangeReference(body, article) {
    if (article.group !== 'paper' && article.group !== 'velocity') return;
    var code = body.querySelector(':scope > .code-block');
    if (!code) return;
    var notes = [], next = code.nextElementSibling;
    while (next) {
      if (next.matches('hr, .code-block, h2:not(.reference-section)')) break;
      notes.push(next); next = next.nextElementSibling;
    }
    if (!notes.length) return;
    var title = code.previousElementSibling;
    if (!title || !/^current-(bundled|generated)-default$|^bundled-default$/.test(title.id)) title = null;
    var row = document.createElement('div'); row.className = 'reference-split';
    var example = document.createElement('div'); example.className = 'reference-example';
    var explanation = document.createElement('div'); explanation.className = 'reference-notes';
    body.insertBefore(row, title || code); row.appendChild(example); row.appendChild(explanation);
    if (title) example.appendChild(title); example.appendChild(code);
    notes.forEach(function (node) { explanation.appendChild(node); });
  }
  // Render the routed article, resolve its config snapshots and highlight the final code blocks.
  function render(id) {
    current=id;sidebar(id);
    if(id==='overview'||id==='instructions'){renderHub(id);return;}
    var a=articles.get(id);
    if(!a){
      setHeading(ui.notFound.title,ui.notFound.description,'Documentation',0);
      document.getElementById('breadcrumbs').innerHTML='<a href="#/docs/overview">Documentation</a>'+icon('chevron')+'<span>'+E(ui.notFound.breadcrumb)+'</span>';
      document.getElementById('article-body').className='';
      document.getElementById('article-body').innerHTML='<div class="doc-not-found">'+E(ui.notFound.body)+'<br><a class="button primary" href="#/docs/overview">'+E(ui.notFound.action)+' '+icon('arrow')+'</a></div>';
      document.getElementById('article-pagination').innerHTML='';setTOC([],id);return;
    }
    var g=groups.get(a.group),mode=a.group==='overview'?'overview':'instructions';
    setHeading(a.title,a.description,g.label,readMinutes(a));
    document.getElementById('breadcrumbs').innerHTML='<a href="#/docs/'+mode+'">Documentation</a>'+icon('chevron')+'<a href="#/docs/'+mode+'">'+E(g.label)+'</a>'+icon('chevron')+'<span>'+E(a.title)+'</span>';
    var body=document.getElementById('article-body');body.className='prose';body.innerHTML=a.bodyHtml;
    if(window.COREX_CONFIG_VIEW)window.COREX_CONFIG_VIEW.renderMounts(body);
    arrangeReference(body,a);
    if(['paper/files','runtime/files','velocity/introduction'].indexOf(id)!==-1){
      var list=data.articles.filter(function(other){return other.group===a.group&&other.id!==a.id;});
      body.innerHTML+='<div class="hub-body">'+section('file-directory','Explore the files',list,true)+'</div>';
    }
    if(window.COREX_HIGHLIGHT)window.COREX_HIGHLIGHT.render(body);
    pagination(a);setTOC(tocFromBody(),id);
  }
  function text() {
    var a=articles.get(current), title=a?a.title:(current==='overview'?ui.hubs.overview.title:ui.hubs.instructions.title);
    var body=document.getElementById('article-body');
    return '# '+title+'\n\n'+(body?body.innerText:'');
  }

  window.CCX_DOCS={render:render,text:text,icon:icon,articles:articles,data:data};
}());
