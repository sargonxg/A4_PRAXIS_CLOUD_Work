import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {mkdtempSync,rmSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';
test('HTTP journey captures, anchors, reviews, reopens and exports a pinned synthetic reading',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'signal-http-')),base='http://127.0.0.1:4321';
 const child=spawn(process.execPath,['code/server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,SIGNAL_PORT:'4321',SIGNAL_LOCAL_DB:join(dir,'ledger.sqlite')},stdio:['ignore','pipe','pipe']});
 try{
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Server did not start.')),4000);child.stdout.once('data',()=>{clearTimeout(timer);resolve();});child.once('error',reject);});
  const post=async body=>{const r=await fetch(base+'/api/signal?country=SD&region=darfur',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();assert.equal(r.status,200,JSON.stringify(data));return data;};
  const registry=await(await fetch(base+'/api/signal?registry=1')).json();assert.equal(registry.countries.length,250);
  const ex=await post({action:'example'});
  const proposed=await post({action:'claim',sourceId:ex.source.id,text:'The fictional proposal has not been adopted.',quote:'The proposal has not been adopted.',topic:'security',stance:'reports'});
  await post({action:'review',claimId:proposed.claim.id,reviewer:'Local test reviewer',decision:'accepted',rationale:'The exact passage explicitly states that the proposal has not been adopted.'});
  const state=await(await fetch(base+'/api/signal?country=SD&region=darfur')).json();assert.equal(state.claims[0].reviewState,'accepted');
  const capsule=await(await fetch(base+'/api/signal?country=SD&region=darfur&export=capsule')).json();assert.equal(capsule.claims[0].synthetic,true);assert.equal(capsule.scope.region,'darfur');
  const brief=await(await fetch(base+'/api/signal?country=SD&region=darfur&export=brief')).text();assert.match(brief,/not been adopted/);assert.match(brief,/SYNTHETIC/);
  const denied=await fetch(base+'/api/signal?country=SD',{method:'POST',headers:{Origin:'https://elsewhere.invalid','Content-Type':'application/json'},body:'{}'});assert.equal(denied.status,403);
  const other=await(await fetch(base+'/api/signal?country=SY')).json();assert.equal(other.claims.length,0);
 }finally{child.kill('SIGINT');await new Promise(resolve=>child.once('exit',resolve));rmSync(dir,{recursive:true});}
});
