// Reference registry. Codes are identifiers, not positions on recognition or borders.
const assigned = 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');
const names = new Intl.DisplayNames(['en'], {type:'region'});
const overrides = {SY:'Syria',PS:'Palestine',TR:'Türkiye',CD:'DR Congo',CG:'Republic of the Congo',CI:"Côte d’Ivoire",KR:'South Korea',KP:'North Korea',VA:'Holy See'};
export const countries = assigned.map(code=>({code,name:overrides[code]||names.of(code),scheme:'ISO3166-1'})).concat({code:'XK',name:'Kosovo',scheme:'user-assigned'}).sort((a,b)=>a.name.localeCompare(b.name));
export const aliases = {SY:['Syria'],PS:['Palestine','Palestinian'],TR:['Turkey','Türkiye'],CD:['Democratic Republic of Congo','DR Congo'],CG:['Republic of Congo','Congo Brazzaville'],CI:['Ivory Coast','Cote d Ivoire'],KR:['South Korea'],KP:['North Korea'],GB:['United Kingdom','Britain'],US:['United States'],AE:['United Arab Emirates'],RU:['Russia'],TZ:['Tanzania'],VA:['Vatican','Holy See']};
export const regions = {
 SY:[{id:'northeast',name:'Northeast Syria',terms:['northeast Syria','Hasakah','Qamishli']},{id:'south',name:'Southern Syria',terms:['Sweida','Suwayda','Daraa']},{id:'coast',name:'Syrian coast',terms:['Latakia','Tartous']}],
 SD:[{id:'darfur',name:'Darfur',terms:['Darfur','El Fasher']},{id:'khartoum',name:'Khartoum',terms:['Khartoum']},{id:'kordofan',name:'Kordofan',terms:['Kordofan']}],
 UA:[{id:'donbas',name:'Donbas',terms:['Donbas','Donetsk','Luhansk']},{id:'south',name:'Southern Ukraine',terms:['Kherson','Zaporizhzhia']},{id:'crimea',name:'Crimea',terms:['Crimea']}],
 PS:[{id:'gaza',name:'Gaza',terms:['Gaza']},{id:'west-bank',name:'West Bank',terms:['West Bank']}],
 CD:[{id:'east',name:'Eastern DR Congo',terms:['North Kivu','South Kivu','Goma']}],
 MM:[{id:'rakhine',name:'Rakhine',terms:['Rakhine','Arakan']},{id:'shan',name:'Shan',terms:['Shan']}],
 YE:[{id:'red-sea',name:'Yemen and the Red Sea',terms:['Red Sea','Hodeidah']},{id:'south',name:'Southern Yemen',terms:['Aden','Hadramaut']}]
};
export function getCountry(code){const c=countries.find(x=>x.code===code);if(!c)throw new Error('Unknown country identifier.');return c;}
function literal(s){if(typeof s!=='string'||!s.trim()||s.length>80||/["():\r\n]/.test(s))throw new Error('Invalid collection term.');return '"'+s.trim()+'"';}
export function makeScope(input){
 const c=getCountry(String(input.country||'BR'));
 const r=input.region?regions[c.code]?.find(x=>x.id===input.region):null;
 if(input.region&&!r)throw new Error('Unknown region for this country.');
 const extra=input.customRegion?String(input.customRegion).trim():'';
 const countryTerms=(aliases[c.code]||[c.name]).map(s=>s.replace(/[()]/g,''));
 const base=countryTerms.length===1?literal(countryTerms[0]):'('+countryTerms.map(literal).join(' OR ')+')';
 const termBlock=r?'('+r.terms.map(literal).join(' OR ')+')':extra?literal(extra):'';
 return {version:1,country:c.code,countryName:c.name,region:r?.id||null,customRegion:extra||null,label:extra||r?.name||c.name,query:base+(termBlock?' '+termBlock:''),coverage:'discovery',locationSemantics:'collection relevance; event location not established'};
}
