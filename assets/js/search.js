(function () {
  'use strict';
  var U=window.CCX_UTILS,E=U.escapeHTML,data=window.COREX_DOCS,ui=window.COREX_UI.search;
  var dialog=document.getElementById('search-dialog'),input=document.getElementById('search-input'),results=document.getElementById('search-results');
  var selected=0,previousFocus=null,timer=null;
  var groups=new Map(data.groups.map(function(g){return[g.id,g.label];}));

  function textFromHTML(html){
    var node=document.createElement('div');node.innerHTML=html||'';
    node.querySelectorAll('.config-file-mount[data-config-file]').forEach(function(mount){
      var file=window.COREX_CONFIG_VIEW&&window.COREX_CONFIG_VIEW.get(mount.dataset.configFile);
      mount.textContent=file?file.content:'';
    });
    return (node.textContent||'').replace(/\s+/g,' ').trim();
  }
  var index=data.articles.map(function(a){
    return {id:a.id,title:a.title,section:'',anchor:'',group:a.group,text:[a.description,textFromHTML(a.bodyHtml)].filter(Boolean).join(' '),boost:a.group==='overview'?2:0};
  });

  function icon(name){return window.CCX_DOCS.icon(name);}
  function highlight(text,query){
    var term=String(query||'').trim();
    if(!term)return E(text);
    var indexAt=String(text).toLowerCase().indexOf(term.toLowerCase());
    if(indexAt<0)return E(text);
    return E(String(text).slice(0,indexAt))+'<mark>'+E(String(text).slice(indexAt,indexAt+term.length))+'</mark>'+E(String(text).slice(indexAt+term.length));
  }
  function select(indexValue){
    var links=results.querySelectorAll('.search-result');
    if(!links.length)return;
    selected=(indexValue+links.length)%links.length;
    links.forEach(function(a,i){a.classList.toggle('is-selected',i===selected);});
    links[selected].scrollIntoView({block:'nearest'});
  }
  /** Show ranked matches or catalog-defined suggestions for this product. */
  function render(){
    selected=0;
    var query=input.value.trim(),items;
    if(query){items=U.search(index,query,14);}
    else{
      // Use product metadata, falling back to the first maintained setup/configuration articles.
      var ids=data.searchSuggestions || data.articles.filter(function(a){return a.group==='getting-started'||a.configFile;}).slice(0,5).map(function(a){return a.id;});
      items=ids.map(function(id){var a=window.CCX_DOCS.articles.get(id);return a&&{id:a.id,title:a.title,group:a.group,anchor:'',excerpt:a.description};}).filter(Boolean);
    }
    var label=query?(items.length+' '+(items.length===1?ui.matchSingular:ui.matchPlural)):ui.usefulStart;
    var html='<div class="search-label">'+E(label)+'</div>';
    if(!items.length)html+='<div class="search-empty">'+E(ui.emptyPrefix)+' <strong>'+E(query)+'</strong>.<br>'+E(ui.emptyHint)+'</div>';
    items.forEach(function(item,i){
      var a=window.CCX_DOCS.articles.get(item.id);
      html+='<a class="search-result'+(i===0?' is-selected':'')+'" href="#/docs/'+item.id+(item.anchor?'~'+item.anchor:'')+'"><div class="search-result-top">'+icon(a?a.icon:'file')+'<span>'+highlight(item.title,query)+'</span><span class="search-result-group">'+E(groups.get(item.group)||'Reference')+'</span></div>'+
        (item.section?'<div class="result-section">'+E(item.section)+'</div>':'')+'<p>'+highlight(item.excerpt||a.description||'',query)+'</p></a>';
    });
    results.innerHTML=html;results.scrollTop=0;
  }
  function close(){
    clearTimeout(timer);
    if(dialog.open)dialog.close();
    if(previousFocus&&previousFocus.isConnected&&!previousFocus.closest('[hidden]'))previousFocus.focus({preventScroll:true});
  }
  function open(){
    previousFocus=document.activeElement;
    if(window.CCX)window.CCX.closeSidebar(false);
    if(!dialog.open)dialog.showModal();
    input.value='';render();input.focus();
  }
  document.querySelectorAll('[data-search-open]').forEach(function(b){b.addEventListener('click',open);});
  document.getElementById('search-close').addEventListener('click',close);
  input.addEventListener('input',function(){clearTimeout(timer);timer=setTimeout(render,70);});
  input.addEventListener('keydown',function(e){
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();return;}
    var links=results.querySelectorAll('.search-result');
    if(e.key==='ArrowDown'){e.preventDefault();select(selected+1);}
    if(e.key==='ArrowUp'){e.preventDefault();select(selected-1);}
    if(e.key==='Enter'&&links.length){e.preventDefault();var href=links[selected].getAttribute('href');close();window.CCX.navigate(href);}
  });
  results.addEventListener('click',function(e){if(e.target.closest('.search-result'))close();});
  dialog.addEventListener('click',function(e){if(e.target===dialog){var r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
  dialog.addEventListener('cancel',function(){setTimeout(function(){if(previousFocus&&previousFocus.isConnected)previousFocus.focus({preventScroll:true});},0);});
  document.addEventListener('keydown',function(e){
    var editing=/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)||e.target.isContentEditable;
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(dialog.open)close();else open();}
    else if(e.key==='/'&&!editing&&!dialog.open){e.preventDefault();open();}
  });
  window.CCX_SEARCH={open:open,close:close,index:index};
}());
