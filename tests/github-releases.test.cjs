'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const modulePath = path.join(__dirname, '../assets/js/core/github-releases.js');
const api = fs.existsSync(modulePath) ? require(modulePath) : {};
const config = { owner:'IceWolf23X', repository:'CoreChatX-website', cacheMinutes:15, requestTimeoutMs:100, maxPages:10,
  assetNames:{paper:['papermc.jar','paper.jar','*-paper-*.jar'],velocity:['velocity.jar','*-velocity-*.jar']} };
const repo = 'IceWolf23X/CoreChatX-website';
const url = 'https://api.github.com/repos/'+repo+'/releases?per_page=100&page=1';
function asset(name, overrides={}) { return {id:name,name,state:'uploaded',size:1024,digest:'sha256:'+'a'.repeat(64),download_count:3,
  browser_download_url:'https://github.com/'+repo+'/releases/download/v2026.3.2/'+name,...overrides}; }
function release(tag='v2026.3.2', overrides={}) { return {id:tag,tag_name:tag,name:'CoreChatX '+tag,draft:false,prerelease:false,
  published_at:'2026-10-02T09:00:00Z',body:'# Changes\n\n- **Improved** chat\n\n```yml\nx: true\n```',
  html_url:'https://github.com/'+repo+'/releases/tag/'+encodeURIComponent(tag),assets:[asset('papermc.jar'),asset('velocity.jar')],...overrides}; }
function response(body, headers={}, status=200) { return {ok:status>=200&&status<300,status,headers:new Headers(headers),json:async()=>body}; }
function storage() {const m = new Map(); return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};}
function snapshot(releases=[release()]) {return {schemaVersion:2,provider:'github',repository:repo,generatedAt:'2026-10-02T08:00:00Z',releases};}

test('GitHub release provider exposes testable normalization and client interfaces',()=>{
  assert.equal(typeof api.normalizeReleases,'function'); assert.equal(typeof api.createClient,'function');
});
test('normalizes version, title, timestamp, markdown and actual remote assets',()=>{
  const [r]=api.normalizeReleases([release()],config).releases;
  assert.equal(r.version,'v2026.3.2'); assert.equal(r.title,'CoreChatX v2026.3.2');
  assert.equal(r.publishedAt,'2026-10-02T09:00:00Z'); assert.match(r.paper.path,/github.com\/IceWolf23X\/CoreChatX-website\/releases\/download/);
  assert.equal(r.paper.sha256,'a'.repeat(64)); assert.equal(r.paper.downloadName,'papermc.jar');
  assert.match(r.changelogHtml,/<strong>Improved<\/strong>/); assert.match(r.changelogHtml,/<pre><code/);
});
test('sorts leading-v numeric versions, hotfixes and prereleases without labelling unknown previews stable',()=>{
  const records=['v2026.3.9','v2026.3.10','2026.3.10.1','v2026.4.0-beta.2','v2026.4.0','v2026.4.0-beta.10'].map(t=>release(t));
  assert.deepEqual(api.normalizeReleases(records,config).releases.map(r=>r.version),['v2026.4.0','v2026.4.0-beta.10','v2026.4.0-beta.2','2026.3.10.1','v2026.3.10','v2026.3.9']);
  assert.equal(api.normalizeReleases([release('v2026.5.0',{prerelease:true})],config).releases[0].channel,'prerelease');
});
test('omits drafts, unpublished entries, unrelated/source-only assets and empty releases',()=>{
  assert.equal(api.normalizeReleases([release('draft',{draft:true}),release('no-date',{published_at:null}),
    release('source-only',{assets:[asset('corechatx-paper-1.0-sources.jar')]}),release('no-assets',{assets:[]})],config).releases.length,0);
});
test('supports one platform, versioned names and a missing digest without a fabricated checksum',()=>{
  const [r]=api.normalizeReleases([release('v1.0',{assets:[asset('corechatx-paper-1.0.jar',{digest:null})]})],config).releases;
  assert.equal(r.paper.exists,true);assert.equal(r.paper.sha256,'');assert.equal(r.velocity.exists,false);
});
test('exact configured filenames take precedence; ambiguous wildcard matches fail closed',()=>{
  const exact=api.normalizeReleases([release('v1.0',{assets:[asset('corechatx-paper-1.jar'),asset('corechatx-paper-2.jar'),asset('papermc.jar')]})],config);
  assert.equal(exact.releases[0].paper.downloadName,'papermc.jar');
  const ambiguous=api.normalizeReleases([release('v1.0',{assets:[asset('corechatx-paper-1.jar'),asset('corechatx-paper-2.jar'),asset('velocity.jar')]})],config);
  assert.equal(ambiguous.releases[0].paper.exists,false);assert.ok(ambiguous.warnings.length);
});
test('rejects unsafe, foreign-repository and deceptive asset URLs',()=>{
  for(const bad of ['javascript:alert(1)','https://evil.test/file.jar','https://github.com.evil.test/'+repo+'/releases/download/x/a.jar',
    'https://user:pass@github.com/'+repo+'/releases/download/x/a.jar','https://github.com/other/repo/releases/download/x/a.jar']){
    assert.equal(api.normalizeReleases([release('v1',{assets:[asset('papermc.jar',{browser_download_url:bad})]})],config).releases.length,0,bad);
  }
});
test('fetches every paginated page; sends no token or browser cookies',async()=>{
  const seen=[];
  const results=await api.fetchAll(config,async(u,o)=>{seen.push({u,o});return seen.length===1?response([release()],{Link:'<'+url.replace('&page=1','&page=2')+'>; rel="next"'}):response([release('v1.0')]);});
  assert.equal(results.length,2);assert.equal(seen.length,2);assert.equal(seen[0].o.credentials,'omit');assert.equal(seen[0].o.cache,'no-store');assert.ok(!seen[0].o.headers.Authorization);
  assert.ok(seen[1].u.endsWith('&page=2'));
});
test('rejects foreign pagination targets, repeated pages, over-limit or malformed responses',async()=>{
  await assert.rejects(api.fetchAll(config,async()=>response([release()],{Link:'<https://evil.test/leak>; rel="next"'})),/pagination/i);
  await assert.rejects(api.fetchAll(config,async()=>response({message:'unexpected'})),/response/i);
  await assert.rejects(api.fetchAll({...config,maxPages:1},async()=>response([release()],{Link:'<'+url.replace('&page=1','&page=2')+'>; rel="next"'})),/pagination/i);
});
test('starts from the matching snapshot and deduplicates concurrent network requests',async()=>{
  let requests=0,resolve;
  const c=api.createClient(config,{snapshot:snapshot(),storage:storage(),fetch:()=>{requests++;return new Promise(r=>{resolve=r;});}});
  assert.equal(c.getState().releases.length,1);
  const first=c.load(),second=c.load();assert.equal(requests,1);resolve(response([release('v2026.4.0')]));await Promise.all([first,second]);
  assert.equal(c.getState().source,'live');assert.equal(c.getState().releases[0].version,'v2026.4.0');
});
test('cache serves repeated visits; a force refresh replaces deleted releases with an authoritative empty list',async()=>{
  const store=storage();let calls=0;const now=Date.parse('2026-10-02T10:00:00Z');
  const c=api.createClient(config,{snapshot:snapshot(),storage:store,now:()=>now,fetch:async()=>{calls++;return response([release()]);}});
  await c.load();await c.load();assert.equal(calls,1);
  const next=api.createClient(config,{snapshot:snapshot(),storage:store,now:()=>now,fetch:async()=>{calls++;return response([]);}});
  await next.load();assert.equal(calls,1);assert.equal(next.getState().source,'cache');
  await next.load({force:true});assert.equal(next.getState().releases.length,0);assert.equal(calls,2);
});
test('expired cache is refreshed; failed later pages never replace the previous full catalog',async()=>{
  const store=storage();let now=Date.parse('2026-10-02T10:00:00Z');
  const first=api.createClient(config,{snapshot:snapshot(),storage:store,now:()=>now,fetch:async()=>response([release()])});await first.load();
  now+=16*60*1000;let calls=0;
  const c=api.createClient(config,{snapshot:snapshot(),storage:store,now:()=>now,fetch:async()=>++calls===1?response([release('v2026.6')],{Link:'<'+url.replace('&page=1','&page=2')+'>; rel="next"'}):response({}, {},500)});
  await c.load();assert.equal(c.getState().status,'error');assert.equal(c.getState().releases[0].version,'v2026.3.2');
});
test('rate-limit errors preserve data and suppress retries until the reset time',async()=>{
  let calls=0;const now=Date.parse('2026-10-02T10:00:00Z');
  const c=api.createClient(config,{snapshot:snapshot(),storage:storage(),now:()=>now,fetch:async()=>{calls++;return response({}, {'x-ratelimit-remaining':'0','x-ratelimit-reset':String(now/1000+3600)},403);}});
  await c.load();assert.equal(c.getState().error.kind,'rateLimit');assert.equal(c.getState().releases.length,1);
  await c.load({force:true});assert.equal(calls,1);assert.equal(c.getState().retryAt,now+3600*1000);
});
test('missing/corrupt/blocked storage and offline fetch errors do not break rendering',async()=>{
  for(const store of [{getItem:()=>'{broken',setItem:()=>{}},{getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('blocked');}}]){
    const c=api.createClient(config,{snapshot:snapshot(),storage:store,fetch:async()=>{throw Error('offline');}});
    await c.load();assert.equal(c.getState().source,'snapshot');assert.equal(c.getState().releases.length,1);assert.equal(c.getState().status,'error');
  }
});
test('repository identity isolates snapshots and caches',()=>{
  const c=api.createClient({...config,repository:'Another-site'},{snapshot:snapshot(),storage:storage()});
  assert.equal(c.getState().releases.length,0);
});
test('snapshot pruning keeps only published public metadata, never executable generated HTML',()=>{
  const raw=release();raw.changelogHtml='<script>bad()</script>';raw.author={email:'private'};
  const s=api.makeSnapshot([raw,release('draft',{draft:true})],config,'2026-10-02T10:00:00Z');
  assert.equal(s.releases.length,1);assert.equal(s.releases[0].changelogHtml,undefined);assert.equal(s.releases[0].author,undefined);
});
test('rate-limit state survives reload without a misleading perpetual loading state',async()=>{
 const store=storage(),now=()=>Date.parse('2026-10-02T10:00:00Z');let calls=0;
 const opts={snapshot:snapshot(),storage:store,now,fetch:async()=>{calls++;return response({}, {'retry-after':'120'},429);}};
 const first=api.createClient(config,opts);await first.load();
 const second=api.createClient(config,opts);await second.load();
 assert.equal(calls,1);assert.equal(second.getState().status,'error');assert.equal(second.getState().error.kind,'rateLimit');
});
test('aborts timed-out HTTP requests without clearing cached data',async()=>{
 const c=api.createClient({...config,requestTimeoutMs:50},{snapshot:snapshot(),storage:storage(),fetch:(_u,o)=>new Promise((_resolve,reject)=>{
  o.signal.addEventListener('abort',()=>reject(Object.assign(new Error('aborted'),{name:'AbortError'})));
 })});
 await c.load();assert.equal(c.getState().error.kind,'timeout');assert.equal(c.getState().releases.length,1);
});
