import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const source=await fs.readFile(new URL('../tools/build-releases.mjs',import.meta.url),'utf8');
const lib=source.includes('export async function buildSnapshot')?await import('../tools/build-releases.mjs'):{};
async function fixture(fn){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'ccx-github-snapshot-'));
 try{
  await fs.mkdir(path.join(root,'assets/js/data'),{recursive:true});
  await fs.writeFile(path.join(root,'assets/js/data/site-config.js'),"window.COREX_SITE={releases:{owner:'IceWolf23X',repository:'CoreExampleX-website'}};");
  await fs.mkdir(path.join(root,'assets/js/generated'),{recursive:true});
  await fn(root,path.join(root,'assets/js/generated/releases.js'));
 }finally{await fs.rm(root,{recursive:true,force:true});}
}
function response(body){return {ok:true,status:200,headers:new Headers(),json:async()=>body};}
test('snapshot builder is explicitly callable and does not execute on import',()=>assert.equal(typeof lib.buildSnapshot,'function'));
test('builds a public empty snapshot and leaves it byte-identical when content is unchanged',async()=>fixture(async(root,out)=>{
 const options={fetch:async()=>response([]),now:()=>new Date('2026-10-02T10:00:00Z')};
 const first=await lib.buildSnapshot(root,options);assert.equal(first.changed,true);
 const bytes=await fs.readFile(out,'utf8');assert.match(bytes,/"schemaVersion": 2/);assert.match(bytes,/IceWolf23X\/CoreExampleX-website/);
 const second=await lib.buildSnapshot(root,{...options,now:()=>new Date('2026-10-03T10:00:00Z')});assert.equal(second.changed,false);assert.equal(await fs.readFile(out,'utf8'),bytes);
}));
test('network failure never overwrites the previously saved snapshot',async()=>fixture(async(root,out)=>{
 await fs.writeFile(out,'previous valid snapshot');
 await assert.rejects(lib.buildSnapshot(root,{fetch:async()=>{throw Error('offline');}}));
 assert.equal(await fs.readFile(out,'utf8'),'previous valid snapshot');
}));
test('does not publish drafts, private author fields, rendered HTML or raw script closing tags',async()=>fixture(async(root,out)=>{
 const r={tag_name:'v1.0',name:'Release',body:'</script><script>bad()</script>',draft:false,prerelease:false,published_at:'2026-10-02T10:00:00Z',assets:[],author:{email:'secret@private.test'},changelogHtml:'<script>bad()</script>'};
 await lib.buildSnapshot(root,{fetch:async()=>response([r,{...r,draft:true,tag_name:'draft-tag'}])});
 const text=await fs.readFile(out,'utf8');assert.doesNotMatch(text,/secret@private|draft-tag|changelogHtml|<\/script>/);assert.match(text,/\\u003c/);
}));
