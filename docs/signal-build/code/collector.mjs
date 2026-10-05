import {normalizeSource,gdeltTime} from './domain.mjs';
export function discoveryURL(scope,timespan='1h',maxrecords=250){if(!['1h','6h','24h'].includes(timespan))throw new Error('Unsupported collection window.');const url=new URL('https://api.gdeltproject.org/api/v2/doc/doc');url.search=new URLSearchParams({query:scope.query,mode:'ArtList',format:'json',timespan,maxrecords:String(maxrecords),sort:'DateDesc'}).toString();return url;}
export async function collect(store,scope,{fetchImpl=fetch,timespan='1h'}={}){
 const url=discoveryURL(scope,timespan);const started=new Date().toISOString();let inserted=0;
 try{
  const response=await fetchImpl(url,{signal:AbortSignal.timeout(20000),headers:{Accept:'application/json'}});
  if(!response.ok)throw new Error(`GDELT HTTP ${response.status}. Saved evidence is retained.`);
  const text=await response.text();if(text.length>2000000)throw new Error('Discovery response exceeded two megabytes.');
  let result;try{result=JSON.parse(text);}catch{throw new Error('GDELT returned non-JSON data.');}
  if(!Array.isArray(result.articles))throw new Error('No valid article list was returned.');
  let skipped=0;
  for(const a of result.articles.slice(0,250)){try{const s=normalizeSource(scope,{title:a.title,body:a.title,url:a.url,language:a.language,discoveredAt:gdeltTime(a.seendate),rights:'reference_only',kind:'discovery_headline'});if(!s.url)throw new Error('Missing discovery URL.');if(store.insertSource(s))inserted++;}catch{skipped++;}}
  const record={status:'succeeded',started,completed:new Date().toISOString(),query:scope.query,window:timespan,returned:result.articles.length,inserted,skipped,saturated:result.articles.length>=250,coverage:'capped discovery sample; not full text or all media'};store.collection(scope.id,record);return record;
 }catch(e){const record={status:'failed',started,error:e.message,inserted,query:scope.query};store.collection(scope.id,record);throw e;}
}
