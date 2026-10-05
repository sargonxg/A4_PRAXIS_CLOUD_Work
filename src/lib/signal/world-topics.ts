import type { SignalWorldHeadline, SignalWorldTopic } from './world-schema';
import { SIGNAL_WORLD_LENSES } from './world-catalog';
export const SIGNAL_WORLD_TOPIC_TAXONOMY = [
 {id:'diplomacy',label:'Diplomacy',terms:['diplomacy','diplomatic','summit','treaty','ceasefire','diplomacia','cúpula','cimeira','tratado','cesse-fogo']},
 {id:'security',label:'Security and conflict',terms:['war','military','missile','conflict','attack','guerra','militar','conflito','ataque']},
 {id:'economy',label:'Economy and trade',terms:['economy','economic','inflation','trade','tariff','economia','econômico','económico','inflação','comércio','tarifa']},
 {id:'governance',label:'Governance and elections',terms:['election','parliament','government','president','eleição','eleições','parlamento','governo','presidente']},
 {id:'climate',label:'Climate and energy',terms:['climate','energy','emissions','flood','clima','energia','emissões','inundação']},
] as const;
function hasTerm(title: string, term: string) { const text = title.normalize('NFKC').toLocaleLowerCase('en'); const escaped = term.normalize('NFKC').toLocaleLowerCase('en').replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`,'u').test(text); }
export function buildSignalWorldTopics(headlines: SignalWorldHeadline[], now: string, baselineAvailable = false): SignalWorldTopic[] {
 const end = Date.parse(now); if (!Number.isFinite(end)) throw new Error('Topic clock is invalid.'); const start = end-86400000, previous = start-86400000;
 const bounded = [...new Map(headlines.slice(0,20).map(h=>[h.id,h])).values()];
 return SIGNAL_WORLD_TOPIC_TAXONOMY.map(topic=> {
  const matching=bounded.filter(h=>topic.terms.some(t=>hasTerm(h.title,t))); const current=matching.filter(h=>h.publishedAt!==null&&Date.parse(h.publishedAt)>=start&&Date.parse(h.publishedAt)<=end); const prior=matching.filter(h=>h.publishedAt!==null&&Date.parse(h.publishedAt)>=previous&&Date.parse(h.publishedAt)<start);
  const comparisonAvailable=baselineAvailable&&prior.length>0;
  return {id:topic.id,label:topic.label,currentCount:current.length,previousCount:comparisonAvailable?prior.length:null,comparisonAvailable,headlineIds:matching.map(h=>h.id).sort(),currentHeadlineIds:current.map(h=>h.id).sort(),previousHeadlineIds:prior.map(h=>h.id).sort(),unknownDateCount:matching.filter(h=>!h.publishedAt||!Number.isFinite(Date.parse(h.publishedAt))).length,windowStart:new Date(start).toISOString(),windowEnd:now,previousWindowStart:new Date(previous).toISOString(),limitation:'Deterministic English/Portuguese keyword matches in at most 20 sampled titles. No semantic or polarization inference. Missing dates are excluded; incomplete prior sampling is not a zero baseline.'};
 });
}

/** Named-place matches describe title wording in explicitly country-associated metadata, not event locations. */
export function filterSignalWorldHeadlines(headlines: SignalWorldHeadline[], countryCode: string, lensId?: string, datedOnly = false): SignalWorldHeadline[] {
 const lens = lensId ? SIGNAL_WORLD_LENSES.find(l=>l.id===lensId) : undefined;
 if (lensId&&(!lens||!lens.countryCodes.includes(countryCode))) return [];
 return headlines.slice(0,20).filter(h=>h.countryCode===countryCode&&(!datedOnly||(h.publishedAt!==null&&Number.isFinite(Date.parse(h.publishedAt))))&&(!lens||lens.keywordAliases.some(term=>hasTerm(h.title,term))));
}
