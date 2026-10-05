import { createHash, randomUUID } from 'node:crypto';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { fetchSignalRepresentation } from './collectors';
import { SIGNAL_WORLD_CATALOG, SIGNAL_WORLD_CATALOG_VERSION, SIGNAL_WORLD_FEEDS, SIGNAL_WORLD_INDICATORS, SIGNAL_WORLD_LIMITATIONS, SIGNAL_WORLD_LENSES } from './world-catalog';
import { buildSignalWorldTopics } from './world-topics';
import type { SignalWorldControl, SignalWorldFeed, SignalWorldHeadline, SignalWorldMetric, SignalWorldSnapshot } from './world-schema';
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const SIGNAL_WORLD_INPUT_DIGEST=hash({catalog: SIGNAL_WORLD_CATALOG, version:SIGNAL_WORLD_CATALOG_VERSION,feeds:SIGNAL_WORLD_FEEDS,lenses:SIGNAL_WORLD_LENSES,indicators:SIGNAL_WORLD_INDICATORS});
const WORLD_PERIOD=12*60*60*1000;
export function signalWorldWindow(now:number):string { return String(Math.floor(now/WORLD_PERIOD)); }
export function claimSignalWorldRefresh(control:SignalWorldControl|undefined, now:number, token:string):SignalWorldControl|null {
 const window=signalWorldWindow(now);
 if (control?.status==='running'&&control.leaseUntil>now) return null;
 const same=control?.window===window&&control.inputDigest===SIGNAL_WORLD_INPUT_DIGEST;
 if (same&&(control!.status==='succeeded'||control!.attempts>=3)) return null;
 return {window,inputDigest:SIGNAL_WORLD_INPUT_DIGEST,status:'running',attempts:same?control!.attempts+1:1,leaseToken:token,leaseUntil:now+180000,attemptedAt:new Date(now).toISOString()};
}
export function canCommitSignalWorld(control:SignalWorldControl|undefined, claim:SignalWorldControl, now:number):boolean { return !!control&&control.status==='running'&&control.leaseToken===claim.leaseToken&&control.inputDigest===claim.inputDigest&&control.window===claim.window&&control.leaseUntil>now; }
function providerUrl(code:string,indicator:string):string {return `https://api.worldbank.org/v2/country/${encodeURIComponent(code)}/indicator/${indicator}?format=json&mrnev=1&per_page=100&source=2`;}
function blankMetric(country:string,definition:typeof SIGNAL_WORLD_INDICATORS[number]):SignalWorldMetric { return {...definition,value:null,year:null,providerUrl:providerUrl(country,definition.indicator),retrievedAt:null,status:'unavailable',license:'World Bank World Development Indicators: CC BY 4.0 with attribution; values unchanged; dataset-specific third-party exceptions apply. The World Bank: World Development Indicators. https://www.worldbank.org/ext/en/legal/terms-conditions/datasets'}; }
export function emptySignalWorld():SignalWorldSnapshot { return {catalogVersion:SIGNAL_WORLD_CATALOG_VERSION,inputDigest:SIGNAL_WORLD_INPUT_DIGEST,updatedAt:null,refresh:{window:'',status:'idle',attemptedAt:null},countries:SIGNAL_WORLD_CATALOG.map(country=>({...country,metrics:SIGNAL_WORLD_INDICATORS.map(i=>blankMetric(country.worldBankCode,i)),headlines:[],providers:[{id:'worldbank',status:'unavailable',attemptedAt:null,lastGoodAt:null}],topics:[]})),limitations:[...SIGNAL_WORLD_LIMITATIONS]}; }
export function parseSignalWorldMetrics(text:string,indicator:string,now:string):Map<string,{value:number;year:number;providerCountryName?:string;providerCountryCode?:string;providerSourceId?:string;providerLastUpdated?:string}> {
 const body:unknown=JSON.parse(text); if (!Array.isArray(body)||body.length!==2||!Array.isArray(body[1])||body[1].length>100) throw new Error('World Bank response has an invalid or excessive record list.');
 // Requests pin the verified WDI source=2; actual API responses may leave sourceid null.
 const meta=body[0] as {pages?:number;sourceid?:string|number|null;lastupdated?:string};if(meta?.sourceid!=null&&String(meta.sourceid)!=='2')throw new Error('World Bank response is not the pinned World Development Indicators dataset.');if(meta?.pages!==1)throw new Error('World Bank bounded response is paginated; coverage is incomplete.');
 const result=new Map<string,{value:number;year:number;providerCountryName?:string;providerCountryCode?:string;providerSourceId?:string;providerLastUpdated?:string}>(); const latestAllowed=new Date(now).getUTCFullYear(); const allowed=new Set(SIGNAL_WORLD_CATALOG.map(c=>c.worldBankCode));
 for(const raw of body[1]){const r=raw as {countryiso3code?:string;indicator?:{id?:string};country?:{id?:string;value?:string};date?:string;value?:unknown}; const year=Number(r.date); if(!allowed.has(r.countryiso3code||'')||r.indicator?.id!==indicator||typeof r.value!=='number'||!Number.isFinite(r.value)||!Number.isInteger(year)||year<1960||year>latestAllowed)continue;const prior=result.get(r.countryiso3code!);if(!prior||year>prior.year)result.set(r.countryiso3code!,{value:r.value,year,...(typeof r.country?.value==='string'?{providerCountryName:r.country.value.slice(0,120)}:{}),...(typeof r.country?.id==='string'?{providerCountryCode:r.country.id.slice(0,8)}:{}),...((typeof meta.sourceid==='string'||typeof meta.sourceid==='number')?{providerSourceId:String(meta.sourceid).slice(0,40)}:{}),...(typeof meta.lastupdated==='string'?{providerLastUpdated:meta.lastupdated.slice(0,40)}:{})});}return result;
}
function feedText(value: unknown): string {
 if (typeof value === 'string') return value;
 if (typeof value === 'number') return String(value);
 if (value && typeof value === 'object' && '#text' in value) return feedText((value as Record<string, unknown>)['#text']);
 return '';
}
export function parseSignalWorldHeadlines(xml:string,feed:SignalWorldFeed,now:string):SignalWorldHeadline[] {
 if(/<!DOCTYPE|<!ENTITY/i.test(xml.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g,''))||XMLValidator.validate(xml)!==true)throw new Error('Malformed or unsafe feed XML.');
 const doc=new XMLParser({ignoreAttributes:false,processEntities:true}).parse(xml);
 if(!doc.rss?.channel&&!doc.feed)throw new Error('Provider is not an RSS/Atom feed.');
 const items=doc.rss?.channel?.item??doc.feed?.entry??[];
 const rows=(Array.isArray(items)?items:[items]).slice(0,20);const out:SignalWorldHeadline[]=[];
 for(const r of rows){
  const title=feedText(r.title).replace(/<[^>]*>/g,'').trim().slice(0,240);
  const authors=r['dc:creator']??r.author;
  const author=(Array.isArray(authors)?authors:[authors]).map(a=>feedText(a?.name??a)).filter(Boolean).join(', ').replace(/<[^>]*>/g,'').trim();
  if(feed.requireAuthor&&(!author||author.length>240))continue;
  // Item-level licence exceptions are excluded from this registry-wide reuse basis.
  const rawItemLicense=r['creativeCommons:license']??r['cc:license'];
  const itemLicense=feedText(rawItemLicense)||feedText(rawItemLicense?.['@_rdf:resource']??rawItemLicense?.['@_href']);
  const normalizedLicense=(value:string)=>value.replace(/^http:/,'https:').replace(/\/$/,'');
  if(rawItemLicense!==undefined&&(!itemLicense||!feed.licenseUrl||normalizedLicense(itemLicense)!==normalizedLicense(feed.licenseUrl)))continue;
  const links=Array.isArray(r.link)?r.link:[r.link];
  const link=links.find((l:unknown)=>typeof l==='string'||(l&&typeof l==='object'&&(!(l as Record<string,unknown>)['@_rel']||(l as Record<string,unknown>)['@_rel']==='alternate')));
  const rawUrl=typeof link==='string'?link:link?.['@_href'];let url:URL;
  try{if(typeof rawUrl!=='string'||rawUrl.length>2048)continue;url=new URL(rawUrl);if(!['http:','https:'].includes(url.protocol)||url.username||url.password)continue;}catch{continue;}
  if(!title)continue;
  const stamp=Date.parse(feedText(r.pubDate??r.published??''));
  const publishedAt=Number.isFinite(stamp)&&stamp<=Date.parse(now)?new Date(stamp).toISOString():null;
  for(const countryCode of feed.countryCodes.filter(c=>SIGNAL_WORLD_CATALOG.some(k=>k.code===c))){
   if(feed.countryTerms&&!feed.countryTerms[countryCode]?.some(term=>new RegExp(`(^|[^\\p{L}\\p{N}])${term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}($|[^\\p{L}\\p{N}])`,'iu').test(title)))continue;
   out.push({id:hash({feedId:feed.id,url:url.toString(),title,publishedAt}).slice(0,48),feedId:feed.id,title,url:url.toString(),publishedAt,retrievedAt:now,language:feed.language,countryCode,countryAssignment:feed.countryTerms?'title-mention':'curated-feed',...(author?{author:author.slice(0,240)}:{}),publisher:feed.publisher??feed.label,license:feed.license,...(feed.licenseUrl?{licenseUrl:feed.licenseUrl}:{})});
  }
 }
 return out;
}
/** Upgrade fresh source-owned metadata while retaining the first observed retrieval clock. */
export function mergeSignalWorldHeadlines(fresh:SignalWorldHeadline[],previous:SignalWorldHeadline[]):SignalWorldHeadline[]{
 const rows=new Map(previous.map(h=>[h.id,h]));
 for(const headline of fresh){const old=rows.get(headline.id);rows.set(headline.id,{...old,...headline,retrievedAt:old?.retrievedAt??headline.retrievedAt});}
 return [...rows.values()].sort((a,b)=>(b.publishedAt??b.retrievedAt).localeCompare(a.publishedAt??a.retrievedAt)).slice(0,20);
}
export interface SignalWorldRepository { read():Promise<SignalWorldSnapshot|undefined>; acquire(now:number,token:string):Promise<{claim:SignalWorldControl;previous:SignalWorldSnapshot|undefined}|null>; commit(claim:SignalWorldControl,snapshot:SignalWorldSnapshot,now:number):Promise<boolean> }
export const signalWorldRepository:SignalWorldRepository={
 async read(){const snap=await getAdminDbOrThrow().collection('signalRuntime').doc('worldLatest').get();return snap.data()?.payload as SignalWorldSnapshot|undefined;},
 async acquire(now,token){const db=getAdminDbOrThrow();const root=db.collection('signalRuntime');return db.runTransaction(async tx=>{const [c,l]=await Promise.all([tx.get(root.doc('worldControl')),tx.get(root.doc('worldLatest'))]);const claim=claimSignalWorldRefresh(c.data() as SignalWorldControl|undefined,now,token);if(!claim)return null;tx.set(root.doc('worldControl'),claim);return{claim,previous:l.data()?.payload as SignalWorldSnapshot|undefined};});},
 async commit(claim,snapshot,now){if(Buffer.byteLength(JSON.stringify(snapshot),'utf8')>650000)throw new Error('World snapshot exceeds its bounded storage allowance.');const db=getAdminDbOrThrow();const root=db.collection('signalRuntime');return db.runTransaction(async tx=>{const control=await tx.get(root.doc('worldControl'));if(!canCommitSignalWorld(control.data() as SignalWorldControl|undefined,claim,now))return false;tx.set(root.doc('worldLatest'),{payload:JSON.parse(JSON.stringify(snapshot))});tx.set(root.doc('worldControl'),{...claim,status:snapshot.refresh.status,error:snapshot.refresh.error||'',leaseToken:null,leaseUntil:0});return true;});},
};
export async function getSignalWorld(repo:SignalWorldRepository=signalWorldRepository):Promise<SignalWorldSnapshot>{return await repo.read()??emptySignalWorld();}
async function boundedMap<T>(items:T[],fn:(item:T)=>Promise<void>){let cursor=0;await Promise.all(Array.from({length:Math.min(3,items.length)},async()=>{while(cursor<items.length){const item=items[cursor++];await fn(item);}}));}
export async function refreshSignalWorld(repo:SignalWorldRepository=signalWorldRepository,read=fetchSignalRepresentation,clock=Date.now):Promise<{status:string;countries?:number}> {
 const started=clock();const acquired=await repo.acquire(started,randomUUID());if(!acquired)return{status:'not-due-or-leased'};const {claim,previous}=acquired;const now=new Date(started).toISOString();const next=emptySignalWorld();const oldCountries=new Map(previous?.countries.map(c=>[c.code,c])??[]);const errors:string[]=[];let successes=0;
 for(const c of next.countries){const old=oldCountries.get(c.code);if(old){c.metrics=c.metrics.map(m=>({...old.metrics.find(x=>x.indicator===m.indicator)??m}));c.headlines=old.headlines.slice(0,20).map(h=>({...h}));c.providers=old.providers.map(p=>({...p}));}}
 const codes=SIGNAL_WORLD_CATALOG.map(c=>c.worldBankCode).join(';');
 const metricErrors:string[]=[];
 await boundedMap([...SIGNAL_WORLD_INDICATORS],async definition=>{try{const url=providerUrl(codes,definition.indicator);const response=await read(url);if(!/json/i.test(response.contentType))throw new Error('World Bank did not return JSON.');const values=parseSignalWorldMetrics(response.text,definition.indicator,now);successes++;for(const c of next.countries){const m=c.metrics.find(x=>x.indicator===definition.indicator)!;const value=values.get(c.worldBankCode);Object.assign(m,value?{...value,retrievedAt:now,status:'available'}:{status:'unavailable'});}}catch(error){const message=error instanceof Error?error.message:'Provider failed';metricErrors.push(message);errors.push('World Bank '+definition.indicator+': '+message);for(const c of next.countries){c.metrics.find(m=>m.indicator===definition.indicator)!.status='failed';}}});
 for(const c of next.countries){const prior=oldCountries.get(c.code)?.providers.find(p=>p.id==='worldbank');c.providers=c.providers.filter(p=>p.id!=='worldbank');c.providers.push({id:'worldbank',status:metricErrors.length?'failed':'available',attemptedAt:now,lastGoodAt:metricErrors.length?prior?.lastGoodAt??null:now,...(metricErrors.length?{error:metricErrors.join('; ').slice(0,500)}:{})});}
 await boundedMap(SIGNAL_WORLD_FEEDS.filter(f=>f.retentionPolicy==='title-link-time-approved').slice(0,8),async feed=>{try{const response=await read(feed.url);if(!/xml|rss|atom/i.test(response.contentType))throw new Error('Feed MIME type is not XML.');const headlines=parseSignalWorldHeadlines(response.text,feed,now);successes++;for(const c of next.countries.filter(c=>feed.countryCodes.includes(c.code))){const retained=c.headlines.filter(h=>h.feedId!==feed.id);const previousFeed=c.headlines.filter(h=>h.feedId===feed.id);c.headlines=mergeSignalWorldHeadlines(headlines.filter(h=>h.countryCode===c.code),[...previousFeed,...retained]);c.providers=c.providers.filter(p=>p.id!==feed.id);c.providers.push({id:feed.id,status:'available',attemptedAt:now,lastGoodAt:now});}}catch(error){const message=error instanceof Error?error.message:'Feed failed';errors.push(feed.id+': '+message);for(const c of next.countries.filter(c=>feed.countryCodes.includes(c.code))){const prior=c.providers.find(p=>p.id===feed.id);c.providers=c.providers.filter(p=>p.id!==feed.id);c.providers.push({id:feed.id,status:'failed',attemptedAt:now,lastGoodAt:prior?.lastGoodAt??null,error:message.slice(0,500)});}}});
 for(const c of next.countries)c.topics=buildSignalWorldTopics(c.headlines,now,c.headlines.some(h=>Date.parse(h.retrievedAt)<=started-86400000));
 next.updatedAt=now;next.refresh={window:claim.window,status:errors.length?successes?'partial':'failed':'succeeded',attemptedAt:now,...(errors.length?{error:errors.join('; ').slice(0,1000)}:{})};const committed=await repo.commit(claim,next,clock());return{status:committed?next.refresh.status:'lease-lost',countries:next.countries.length};
}
