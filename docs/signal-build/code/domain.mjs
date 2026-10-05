import {createHash,randomUUID} from 'node:crypto';
export const hash=text=>createHash('sha256').update(text).digest('hex');
export const topicRules=[
 {id:'security',label:'Security and civilian protection',terms:['civilian','ceasefire','attack','violence','security','قتل','عنف','مدني','أمن']},
 {id:'politics',label:'Governance and legitimacy',terms:['government','election','transition','constitution','حكومة','انتقال','دستور','انتخاب']},
 {id:'external',label:'Diplomacy and external actors',terms:['diploma','sanction','united nations','russia','turkey','عقوبات','روسيا','تركيا']},
 {id:'humanitarian',label:'Aid access and displacement',terms:['humanitarian','refugee','displaced','aid','نازح','مساعد','لاجئ']},
 {id:'other',label:'Needs classification',terms:[]}
];
export function topicTags(text){const t=text.toLocaleLowerCase();const matches=topicRules.filter(x=>x.terms.some(v=>t.includes(v))).map(x=>x.id);return matches.length?matches:['other'];}
export function sourceURL(raw){if(!raw)return '';const u=new URL(raw);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)throw new Error('Source links must use http or https, without credentials.');for(const key of [...u.searchParams.keys()])if(key.startsWith('utm_')||['fbclid','gclid'].includes(key))u.searchParams.delete(key);u.hash='';return u.href;}
export function gdeltTime(s){if(typeof s!=='string'||!/^\d{8}T\d{6}Z$/.test(s))return null;const iso=`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}T${s.slice(9,11)}:${s.slice(11,13)}:${s.slice(13,15)}Z`;return Number.isNaN(Date.parse(iso))?null:iso;}
export function normalizeSource(scope,input,now=new Date().toISOString()){
 const title=String(input.title||'').trim();const body=String(input.body||'');
 if(!title||title.length>500||!body||body.length>16000)throw new Error('Use a title up to 500 characters and source text up to 16,000 characters.');
 const url=sourceURL(input.url||'');const rights=input.rights||'reference_only';
 if(!['reference_only','owned','permission'].includes(rights))throw new Error('Specify the source retention basis.');
 if(rights==='reference_only'&&body.length>600)throw new Error('Reference captures are capped at 600 characters; longer text needs ownership or permission.');
 const kind=input.kind||'supplied_text';if(!['supplied_text','discovery_headline','synthetic'].includes(kind))throw new Error('Unknown source representation.');
 if(kind==='discovery_headline'&&body!==title)throw new Error('Discovery can retain a headline only.');
 if(input.publishedAt&&Number.isNaN(Date.parse(input.publishedAt)))throw new Error('Invalid publication time.');
 const contentHash=hash(body);const revisionId='src_'+hash(scope.id+'|'+url+'|'+title+'|'+contentHash).slice(0,32);
 return {id:revisionId,scopeId:scope.id,title,url,domain:url?new URL(url).hostname:'Supplied material',body,contentHash,kind,rights,language:String(input.language||'unknown').slice(0,40),publishedAt:input.publishedAt||null,discoveredAt:input.discoveredAt||null,capturedAt:now,topics:topicTags(title+' '+body),epistemicStatus:kind==='discovery_headline'?'discovery':kind==='synthetic'?'synthetic':'unreviewed',eventTime:null};
}
export function proposeClaim(source,input){
 if(source.kind==='discovery_headline')throw new Error('Capture source text first. A discovery headline cannot ground a substantive claim.');
 const text=String(input.text||'').trim(),quote=String(input.quote||'');
 if(!text||text.length>1200||!quote.trim()||quote.length>1200)throw new Error('Use a claim and exact evidence excerpt up to 1,200 characters each.');
 const start=source.body.indexOf(quote);if(start<0)throw new Error('The evidence excerpt must occur exactly in the captured representation.');
 if(!topicRules.some(t=>t.id===input.topic))throw new Error('Unknown topic.');
 if(!['reports','supports','contradicts'].includes(input.stance))throw new Error('Unknown evidence relation.');
 return {id:randomUUID(),scopeId:source.scopeId,sourceId:source.id,sourceHash:source.contentHash,text,quote,start,end:start+quote.length,topic:input.topic,stance:input.stance,epistemicStatus:'source_reading',reviewState:'proposed',synthetic:source.kind==='synthetic',createdAt:new Date().toISOString()};
}
export function reviewClaim(claim,source,input){
 if(source.id!==claim.sourceId||source.contentHash!==claim.sourceHash||source.body.slice(claim.start,claim.end)!==claim.quote)throw new Error('Evidence revision mismatch. Review refused.');
 if(!['accepted','rejected','unresolved'].includes(input.decision))throw new Error('Unknown review decision.');
 const reviewer=String(input.reviewer||'').trim(),rationale=String(input.rationale||'').trim();
 if(!reviewer||reviewer.length>100||!rationale||rationale.length>1600)throw new Error('Record a reviewer and a concise rationale.');
 return {id:randomUUID(),claimId:claim.id,sourceHash:claim.sourceHash,decision:input.decision,reviewer,rationale,reviewedAt:new Date().toISOString(),scope:'source reading only; event truth and author intent not established'};
}
export function graphProjection(sources,claims){return {nodes:[...sources.map(s=>({id:s.id,type:'SourceRevision',label:s.title})),...topicRules.map(t=>({id:t.id,type:'Topic',label:t.label})),...claims.map(c=>({id:c.id,type:'Claim',label:c.text,reviewState:c.reviewState}))],edges:[...sources.flatMap(s=>s.topics.map(t=>({from:s.id,to:t,type:'keyword_match',status:'triage'}))),...claims.flatMap(c=>[{from:c.sourceId,to:c.id,type:'anchors_reading',sourceHash:c.sourceHash,span:{start:c.start,end:c.end}},{from:c.id,to:c.topic,type:'classified_as',status:'analyst_proposal'}])]};}
export function capsuleSnapshot(scope,sources,claims,reviews){return {profile:'praxis-signal-extension/0.1',nativePraxisImport:'adapter_required',role:'Situation',id:'signal:'+scope.id,revisionId:randomUUID(),asOf:new Date().toISOString(),scope,sources,claims,reviews,graph:graphProjection(sources,claims),limitations:['Topic labels are keyword triage, not narrative analysis.','Review records a source reading, not verification of event truth.','No audience reach, public opinion, coordination or intent is inferred.','Synthetic examples remain marked in every export.','Discovery timestamps are not publication or event dates.']};}
export function exportBrief(scope,sources,claims){const accepted=claims.filter(c=>c.reviewState==='accepted');return `# SIGNAL ${scope.label} evidence note\n\nAs of ${new Date().toISOString()}\nDRAFT template export. No AI synthesis or final editorial review.\n\n## Reviewed source readings\n${accepted.length?accepted.map((c,i)=>`${i+1}. ${c.synthetic?'[SYNTHETIC EXAMPLE] ':''}${c.text}\n   Evidence: ${c.quote}\n   Source: ${sources.find(s=>s.id===c.sourceId)?.url||'Supplied material'}\n   Revision: ${c.sourceHash}\n   Review: ${c.reviewer}; ${c.rationale}`).join('\n\n'):'No accepted readings. Add and review evidence first.'}\n\n## Collection limits\n${sources.length} stored representations. Discovery records contain headlines only. Keyword matches are triage, not narrative interpretation. Neither frequency nor geographic relevance establishes public belief or event location. Source review does not verify an underlying event or deceptive intent. No production PRAXIS integration, AI analysis, or editorial approval is implied.\n\n## Source register\n${sources.map((s,i)=>`${i+1}. ${s.title} | ${s.url||'Supplied material'} | ${s.kind} | publication: ${s.publishedAt||'unknown'} | discovery: ${s.discoveredAt||'unknown'} | capture: ${s.capturedAt} | ${s.contentHash}`).join('\n')}`;}
