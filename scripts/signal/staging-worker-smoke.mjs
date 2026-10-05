import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
const require=createRequire(new URL('../../package.json', import.meta.url));
const {GoogleAuth}=require('google-auth-library');
const {initializeApp,cert}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');
const {initializeFirestore}=require('firebase-admin/firestore');
const base=process.env.SIGNAL_SMOKE_BASE_URL;
if(!base || !/^https:\/\/signal---praxis-frontend-pgoyqovcza-uc\.a\.run\.app$/.test(base)) throw new Error('Supply exact tagged staging URL via SIGNAL_SMOKE_BASE_URL; helper refuses production');
const report={target:base,proof:{},cleanup:{}};
const state={desk:null,cookie:null,secondUid:null,secondCookie:null};
let db,authAdmin;
const fail=(message)=>{throw new Error(message)};
async function secret(client,name){try{const r=await client.request({url:`https://secretmanager.googleapis.com/v1/projects/praxisbytacitus/secrets/${name}/versions/latest:access`,timeout:20000});return Buffer.from(r.data.payload.data,'base64').toString('utf8')}catch{fail('Existing secure binding unavailable: '+name)}}
async function request(path,{method='GET',body,cookie,headers={}}={}){let response;try{response=await fetch(base+path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{'Cookie':cookie}:{}),...headers},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(120000),redirect:'error'})}catch{fail(`Tagged ${method} ${path.split('?')[0]} transport failure`)}let data;try{data=await response.json()}catch{data={}}return {response,data}}
async function firebaseExchange(kind,body){let response;try{response=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:'+kind+'?key=AIzaSyAHNn4zJdMaxJXziRNa9SmHRFKUvO1q9uA',{method:'POST',headers:{'Content-Type':'application/json','Referer':'https://praxis.tacitus.me/','Origin':'https://praxis.tacitus.me'},body:JSON.stringify(body),signal:AbortSignal.timeout(30000)})}catch{fail('Firebase identity exchange transport failure')}if(!response.ok)fail('Firebase identity exchange HTTP '+response.status);return response.json()}
async function session(token){const r=await request('/api/auth/session',{method:'POST',body:{token},headers:{Origin:base}});if(r.response.status!==200)fail('Actual session creation HTTP '+r.response.status);const cookie=(r.response.headers.get('set-cookie')||'').split(';')[0];if(!cookie.startsWith('tacitus-auth-session='))fail('Session cookie missing');return cookie}
async function mutate(action,fields={}){const r=await request('/api/signal',{method:'POST',cookie:state.cookie,body:{action,...(action==='create'?{}:{deskId:state.desk.id,expectedVersion:state.desk.version}),...fields}});if(!r.response.ok)fail('Owned SIGNAL '+action+' HTTP '+r.response.status);state.desk=r.data.desk;return state.desk}
async function reload(){const r=await request('/api/signal?deskId='+state.desk.id,{cookie:state.cookie});if(!r.response.ok)fail('Owned desk readback HTTP '+r.response.status);state.desk=r.data.desk;return state.desk}
async function cleanup(){
 if(state.desk&&state.cookie){try{await reload();if(state.desk.watched)await mutate('watch',{watched:false});await reload();const r=await request('/api/signal?deskId='+state.desk.id+'&expectedVersion='+state.desk.version,{method:'DELETE',cookie:state.cookie});report.cleanup.ownedDeskDeleted=r.response.ok;const after=await request('/api/signal?deskId='+state.desk.id,{cookie:state.cookie});report.cleanup.deletedDeskUnavailable=after.response.status===404}catch{report.cleanup.ownedDeskDeleted=false;report.cleanup.deskId=state.desk.id}}
 if(state.secondUid&&db&&authAdmin){try{await db.recursiveDelete(db.collection('users').doc(state.secondUid));for(const [collection,field] of [['credit_transactions','userId'],['rate_limits','uid']]){const rows=await db.collection(collection).where(field,'==',state.secondUid).get();for(const row of rows.docs)await db.recursiveDelete(row.ref)}await authAdmin.deleteUser(state.secondUid);report.cleanup.temporaryIdentityDeleted=true}catch{report.cleanup.temporaryIdentityDeleted=false;report.cleanup.temporaryUid=state.secondUid}}
}
try{
 const ga=new GoogleAuth({scopes:['https://www.googleapis.com/auth/cloud-platform']});const client=await ga.getClient();
 const bindings=await Promise.all(['praxis-firebase-sa','praxis-canary-email','praxis-canary-password','praxis-cron-secret'].map(name=>secret(client,name)));
 const service=JSON.parse(bindings[0]);if(service.private_key)service.private_key=service.private_key.replace(/\\n/g,'\n');const app=initializeApp({credential:cert(service),projectId:'praxisbytacitus'},'signal-stage-worker-'+randomUUID());db=initializeFirestore(app,{preferRest:true});authAdmin=getAuth(app);
 const login=await firebaseExchange('signInWithPassword',{email:bindings[1].trim(),password:bindings[2].replace(/[\r\n]+$/,''),returnSecureToken:true});state.cookie=await session(login.idToken);report.proof.realCanarySession=true;
 await mutate('create',{name:'SIGNAL synthetic disposable worker acceptance '+new Date().toISOString(),question:'Synthetic release test: does the Portuguese statement deny approval, and does explicitly watching NASA produce bounded source receipts through Cloud Tasks?',audience:'Disposable release acceptance; no customer publication',scope:{kind:'thematic',label:'Synthetic space-science release acceptance',countries:['US']},languages:['en','pt'],windowDays:7,sourcePack:{id:'release_acceptance',version:1,allowGdelt:false,feeds:[{url:process.env.SIGNAL_SMOKE_FEED_URL||'https://www.nasa.gov/rss/dyn/breaking_news.rss',allowCapture:true,basis:'Official NASA published RSS summary feed; bounded internal source-reading acceptance; no external redistribution',allowExport:false}]}});
 report.proof.ownedDeskCreated=true;
 if(process.env.SIGNAL_SMOKE_SECOND_IDENTITY==='1'){
  state.secondUid='signal_acceptance_'+randomUUID().replaceAll('-','');
  const token=await authAdmin.createCustomToken(state.secondUid);const second=await firebaseExchange('signInWithCustomToken',{token,returnSecureToken:true});state.secondCookie=await session(second.idToken);
  const isolation=[];
  for(const suffix of ['', '&view=graph', '&export=bundle&briefId=nonexistent']){
   const isolated=await request('/api/signal?deskId='+state.desk.id+suffix,{cookie:state.secondCookie});
   if(isolated.response.status!==404||JSON.stringify(isolated.data).includes(state.desk.ownerUid)||'desk' in isolated.data||'graph' in isolated.data||'sources' in isolated.data)fail('Cross-owner desk, graph or export request leaked ownership or data');
   isolation.push({surface:suffix.includes('export')?'export':suffix.includes('graph')?'graph':'desk',status:isolated.response.status});
  }
  report.proof.secondRealIdentityIsolated=isolation;
 }
 const unauth=await request('/api/signal/worker',{method:'POST',body:{ownerUid:login.localId,jobId:'wrong_identity'}});if(unauth.response.status!==401)fail('Worker missing-identity rejection failed');report.proof.unauthenticatedWorkerRejected=true;
 // Provider proof remains independent from Cloud Tasks and watch acceptance.
 try{
  await mutate('capture',{title:'Synthetic Portuguese release acceptance statement',text:'O ministro não aprovou a proposta.',language:'pt',kind:'original_text',publicationTime:null,synthetic:true,rights:{basis:'Own synthetic acceptance fixture; internal use only',allowExport:false}});
  const source=state.desk.sources.find(s=>s.synthetic&&s.title==='Synthetic Portuguese release acceptance statement');
  if(!source)fail('Analysis synthetic capture missing');
  const analysis=await request('/api/ai/signal',{method:'POST',cookie:state.cookie,body:{action:'analyze',deskId:state.desk.id,expectedVersion:state.desk.version,sourceRevisionId:source.id}});
  if(analysis.response.status!==200)fail('Analysis calibrated route HTTP '+analysis.response.status);
  state.desk=analysis.data.desk;
  const run=[...state.desk.runs].reverse().find(r=>r.provider==='analysis');
  const proposals=state.desk.claims.filter(c=>c.derivation?.runId===run?.id);
  if(!run||run.status!=='succeeded'||!run.model||proposals.some(c=>c.status!=='proposed'))fail('Analysis persisted proposed-only receipt invalid');
  report.proof.liveCalibratedAnalysis={status:analysis.response.status,runStatus:run.status,model:run.model,tokens:run.tokens??0,proposalCount:proposals.length,allProposalsUnaccepted:true};
 }catch(e){
  report.proof.liveCalibratedAnalysis={passed:false,error:e instanceof Error&&/^(Analysis |Owned |Tagged )/.test(e.message)?e.message:'Analysis gate failed; sensitive error suppressed'};
  process.exitCode=1;
  await reload();
 }
 await mutate('watch',{watched:true});report.proof.explicitWatchEnabled=true;
 const sweep=await request('/api/signal/sweep',{method:'POST',headers:{'x-cron-secret':bindings[3]}});if(!sweep.response.ok)fail('Authenticated tagged sweep HTTP '+sweep.response.status);report.proof.sweep={status:sweep.response.status,...sweep.data};
 let terminal=null;
 for(let i=0;i<24;i++){
  const snapshot=await db.collection('users').doc(login.localId).collection('signalJobs').where('deskId','==',state.desk.id).get();
  const jobs=snapshot.docs.map(d=>d.data());const finished=jobs.find(j=>j.status==='succeeded');
  if(finished){terminal=finished;break}
  if(jobs.some(j=>j.status==='cancelled'||j.status==='failed'&&j.attempts>=3))fail('Cloud Tasks collector exhausted or cancelled before successful receipt');
  await new Promise(resolve=>setTimeout(resolve,10000));
 }
 if(!terminal)fail('Bounded Cloud Tasks receipt wait expired');
 await reload();const receipt=state.desk.runs.find(r=>r.id===terminal.runId);
 if(!terminal.dispatched||!receipt||!['succeeded','partial'].includes(receipt.status)||receipt.count<1)fail('Cloud Tasks persisted receipt incomplete');
 report.proof.actualCloudTasksWorker={status:terminal.status,attempts:terminal.attempts,dispatched:terminal.dispatched,receiptStatus:receipt.status,collectedSources:receipt.count};
 await mutate('watch',{watched:false});if(state.desk.watched)fail('Watch pause readback failed');report.proof.watchPauseVerified=true;
}catch(e){report.failure=e instanceof Error&&/^(Supply exact|Existing secure|Tagged |Firebase |Actual session|Session cookie|Owned |Cross-owner|Worker |Authenticated tagged|Cloud Tasks |Bounded Cloud|Watch pause)/.test(e.message)?e.message:'Acceptance operation failed; sensitive error suppressed';process.exitCode=1}
finally{await cleanup();if(report.cleanup.ownedDeskDeleted===false||report.cleanup.temporaryIdentityDeleted===false)process.exitCode=1;console.log(JSON.stringify(report,null,2))}
