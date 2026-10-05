// Local acceptance harness only. Production adapters must use PRAXIS auth/storage/jobs.
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {Store} from './store.mjs';
import {countries,regions,makeScope} from './geography.mjs';
import {normalizeSource,proposeClaim,reviewClaim,capsuleSnapshot,exportBrief} from './domain.mjs';
import {collect} from './collector.mjs';
const port=Number(process.env.SIGNAL_PORT||4310),origin=`http://127.0.0.1:${port}`;
const store=new Store(process.env.SIGNAL_LOCAL_DB||fileURLToPath(new URL('../signal.sqlite',import.meta.url)));
const html=readFileSync(new URL('../prototype/index.html',import.meta.url));
const locks=new Map();
async function collectOnce(scope){const last=locks.get(scope.id);if(last&&Date.now()-last<15*60*1000)throw new Error('Wait 15 minutes between discovery requests for this scope.');locks.set(scope.id,Date.now());return collect(store,scope,{timespan:'24h'});}
const server=createServer(async(req,res)=>{
 const reply=(data,status=200,type='application/json')=>{res.writeHead(status,{'Content-Type':type+';charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'"});res.end(typeof data==='string'?data:JSON.stringify(data));};
 try{
  // Prevent DNS rebinding into a loopback-only reference harness.
  if(req.headers.host!==`127.0.0.1:${port}`)return reply({error:'Use the printed loopback address.'},403);
  const u=new URL(req.url,origin);
  if(req.method==='GET'&&u.pathname==='/')return reply(html.toString(),200,'text/html');
  if(u.pathname!=='/api/signal')return reply({error:'Not found.'},404);
  if(req.method==='GET'&&u.searchParams.get('registry')==='1')return reply({countries,regions});
  const scope=store.scope(makeScope({country:u.searchParams.get('country')||'BR',region:u.searchParams.get('region')||'',customRegion:u.searchParams.get('custom')||''}));
  if(req.method==='GET'){const data=store.state(scope.id);if(u.searchParams.get('export')==='brief')return reply(exportBrief(scope,data.sources,data.claims),200,'text/markdown');if(u.searchParams.get('export')==='capsule')return reply(capsuleSnapshot(scope,data.sources,data.claims,data.reviews));return reply({scope,...data});}
  if(req.method!=='POST')return reply({error:'Unsupported method.'},405);
  if(req.headers.origin!==origin)return reply({error:'Same-origin requests only.'},403);
  if(!req.headers['content-type']?.startsWith('application/json'))return reply({error:'JSON required.'},415);
  let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>40000)return reply({error:'Capture exceeds request limit.'},413);}
  const input=JSON.parse(raw);
  if(input.action==='collect')return reply(await collectOnce(scope));
  if(input.action==='capture'){const s=normalizeSource(scope,input);return reply({source:s,inserted:store.insertSource(s)});}
  if(input.action==='claim'){const c=proposeClaim(store.source(input.sourceId,scope.id),input);store.insertClaim(c);return reply({claim:c});}
  if(input.action==='review'){const c=store.claim(input.claimId,scope.id),s=store.source(c.sourceId,scope.id);const r=reviewClaim(c,s,input);store.insertReview(r);return reply({review:r});}
  if(input.action==='example'){const source=normalizeSource(scope,{title:'Fictional training source A',body:'In this fictional exercise, the council announced a ceasefire proposal. The proposal has not been adopted. A separate statement reports aid access remains restricted.',kind:'synthetic',rights:'owned',language:'English'});store.insertSource(source);return reply({source,synthetic:true});}
  return reply({error:'Unknown action.'},400);
 }catch(e){return reply({error:e.message},400);}
});
server.listen(port,'127.0.0.1',()=>console.log(`SIGNAL reference harness: ${origin} (local only; no production PRAXIS integration)`));
// Optional bounded watch loop: only explicitly selected countries are collected.
const watched=process.argv.slice(2).filter(x=>/^[A-Z]{2}$/.test(x)).map(country=>store.scope(makeScope({country})));
if(watched.length){const tick=async()=>{for(const scope of watched){try{await collectOnce(scope);}catch(e){console.error(scope.label+': '+e.message);}}};void tick();setInterval(tick,15*60*1000).unref();}
process.on('SIGINT',()=>{server.close();store.close();process.exit(0);});
