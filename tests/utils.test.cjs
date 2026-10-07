const {test} = require('node:test');
const assert = require('node:assert/strict');
const U = require('../assets/js/utils.js');
test('HTML text cannot inject markup',()=>assert.equal(U.escapeHTML('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;'));
test('malformed percent-encoded route is safe',()=>assert.equal(U.routeParts('#/docs/%E0%A4%A').id,'not-found'));
test('heading route preserves the article',()=>assert.deepEqual(U.routeParts('#/docs/paper/chat-yml~format-priority'),{view:'docs',id:'paper/chat-yml',anchor:'format-priority'}));
test('search ranks a configuration filename',()=>{
 const index=[{id:'a',title:'Other',section:'',text:'This references chat.yml'},{id:'b',title:'chat.yml',section:'',text:'formats'}];
 assert.equal(U.search(index,'chat.yml')[0].id,'b');
});
test('search finds exact nested keys in code',()=>{
 const index=[{id:'a',title:'chatitems.yml',section:'',text:'discord-images.enabled controls attachments'}];
 assert.equal(U.search(index,'discord-images.enabled')[0].id,'a');
 assert.equal(U.search(index,'nonexistent').length,0);
 assert.equal(U.search(index,'').length,0);
});
test('one best matching result per article',()=>{
 const index=[{id:'a',title:'A',section:'',text:'keyword'},{id:'a',title:'A',section:'keyword',text:'keyword'}];
 assert.equal(U.search(index,'keyword').length,1);
});
test('untrusted route text cannot become HTML',()=>{
 assert.equal(U.routeParts('#/docs/%22%3E%3Cimg%20src=x%20onerror=alert(1)%3E').id,'not-found');
 assert.equal(U.routeParts('#/docs/overview~%22%3E%3Cscript%3E').id,'not-found');
});
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const boot = fs.readFileSync(path.join(__dirname,'../assets/js/boot.js'),'utf8');
function bootContext(getItem){
 const document={
   documentElement:{dataset:{},style:{setProperty:()=>{}},lang:''},
   querySelector:()=>({content:''}),
   getElementById:()=>({href:''})
 };
 const context={document,localStorage:{getItem}};
 context.window=context;
 context.COREX_SITE={brand:{product:'CoreChatX',tagline:'Tagline',language:'en'},theme:{default:'light',storageKey:'corex.theme',light:{},dark:{}}};
 return context;
}
test('stored theme is restored before rendering',()=>{
 const context=bootContext(()=> 'dark');
 vm.runInNewContext(boot,context);assert.equal(context.document.documentElement.dataset.theme,'dark');
});
test('storage denial keeps the requested light default',()=>{
 const context=bootContext(()=>{throw Error('denied')});
 vm.runInNewContext(boot,context);assert.equal(context.document.documentElement.dataset.theme,'light');
});

test('release routes select the releases page and optional version', () => {
  assert.deepEqual(U.routeParts('#/releases'), { view:'releases', id:'', anchor:'' });
  assert.deepEqual(U.routeParts('#/releases/2026.4.0-beta.1'), { view:'releases', id:'2026.4.0-beta.1', anchor:'' });
});

test('GitHub release routes retain encoded slash and build-metadata tags',()=>{
  assert.deepEqual(U.routeParts('#/releases/release%2Fv1.2.3%2Bbuild.4'), {view:'releases',id:'release/v1.2.3+build.4',anchor:''});
});
