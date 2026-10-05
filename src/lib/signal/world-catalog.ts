import type { SignalWorldCatalogCountry, SignalWorldFeed, SignalWorldLens } from './world-schema';
export const SIGNAL_WORLD_CATALOG_VERSION = 'world-public-panel/2026-10-05.2';
const checkedAt = null;
// Read-only reachability proof; not verification of statements, officeholders or reuse rights.
const governmentChecks: Partial<Record<string, { url: string; provenanceUrl: string; checkedAt: string; verification: 'verified' }>> = {
  "US": {
    "url": "https://www.usa.gov/",
    "provenanceUrl": "https://www.usa.gov/",
    "checkedAt": "2026-10-05T23:02:09.861879+00:00",
    "verification": "verified"
  },
  "GB": {
    "url": "https://www.gov.uk/",
    "provenanceUrl": "https://www.gov.uk/",
    "checkedAt": "2026-10-05T23:02:09.862899+00:00",
    "verification": "verified"
  },
  "DE": {
    "url": "https://www.bundesregierung.de/breg-en",
    "provenanceUrl": "https://www.bundesregierung.de/breg-en",
    "checkedAt": "2026-10-05T23:02:09.867089+00:00",
    "verification": "verified"
  },
  "IT": {
    "url": "https://www.governo.it/en",
    "provenanceUrl": "https://www.governo.it/en",
    "checkedAt": "2026-10-05T23:02:09.884198+00:00",
    "verification": "verified"
  },
  "BR": {
    "url": "https://www.gov.br/planalto/en",
    "provenanceUrl": "https://www.gov.br/en",
    "checkedAt": "2026-10-05T23:02:09.895974+00:00",
    "verification": "verified"
  },
  "UA": {
    "url": "https://www.kmu.gov.ua/en",
    "provenanceUrl": "https://www.kmu.gov.ua/en",
    "checkedAt": "2026-10-05T23:02:09.935464+00:00",
    "verification": "verified"
  },
  "CN": {
    "url": "https://english.www.gov.cn/",
    "provenanceUrl": "https://english.www.gov.cn/",
    "checkedAt": "2026-10-05T23:02:09.952597+00:00",
    "verification": "verified"
  },
  "JP": {
    "url": "https://www.japan.go.jp/",
    "provenanceUrl": "https://www.japan.go.jp/",
    "checkedAt": "2026-10-05T23:02:09.960821+00:00",
    "verification": "verified"
  },
  "IN": {
    "url": "https://www.india.gov.in/",
    "provenanceUrl": "https://www.india.gov.in/",
    "checkedAt": "2026-10-05T23:02:10.009115+00:00",
    "verification": "verified"
  },
  "TR": {
    "url": "https://www.turkiye.gov.tr/",
    "provenanceUrl": "https://www.turkiye.gov.tr/",
    "checkedAt": "2026-10-05T23:02:10.128608+00:00",
    "verification": "verified"
  },
  "ZA": {
    "url": "https://www.gov.za/",
    "provenanceUrl": "https://www.gov.za/",
    "checkedAt": "2026-10-05T23:02:10.520456+00:00",
    "verification": "verified"
  }
};

// A curated starting panel, not a ranking or exhaustive geopolitical map.
const rows = [
 ['US','USA','United States','Americas','https://www.usa.gov/','USA.gov'],
 ['CA','CAN','Canada','Americas','https://www.canada.ca/','Government of Canada'],
 ['BR','BRA','Brazil','Americas','https://www.gov.br/','Government of Brazil'],
 ['TR','TUR','Türkiye','Middle East','https://www.turkiye.gov.tr/','Türkiye government gateway'],
 ['GB','GBR','United Kingdom','Europe','https://www.gov.uk/','GOV.UK'],
 ['FR','FRA','France','Europe','https://www.info.gouv.fr/','Government of France'],
 ['DE','DEU','Germany','Europe','https://www.bundesregierung.de/','Federal Government'],
 ['IT','ITA','Italy','Europe','https://www.governo.it/','Government of Italy'],
 ['UA','UKR','Ukraine','Europe','https://www.kmu.gov.ua/en','Cabinet of Ministers of Ukraine'],
 ['RU','RUS','Russia','Europe','http://government.ru/en/','Government of Russia'],
 ['CN','CHN','China','Asia','https://english.www.gov.cn/','State Council of China'],
 ['IN','IND','India','Asia','https://www.india.gov.in/','National Portal of India'],
 ['JP','JPN','Japan','Asia','https://www.japan.go.jp/','Government of Japan'],
 ['KR','KOR','South Korea','Asia','https://www.korea.net/','Korea.net'],
 ['ID','IDN','Indonesia','Asia','https://indonesia.go.id/','Indonesia national portal'],
 ['IL','ISR','Israel','Middle East','https://www.gov.il/en','Government of Israel'],
 ['PS','PSE','Palestine','Middle East','https://www.mofa.pna.ps/','Ministry of Foreign Affairs'],
 ['IR','IRN','Iran','Middle East','https://en.mfa.gov.ir/','Ministry of Foreign Affairs'],
 ['ZA','ZAF','South Africa','Africa','https://www.gov.za/','South African Government'],
 ['SA','SAU','Saudi Arabia','Middle East','https://www.my.gov.sa/','Saudi national portal'],
] as const;
/** Product-curated directory scopes, not live conflict findings or administrative boundary data. */
export const SIGNAL_WORLD_LENSES: SignalWorldLens[] = [
 {id:'ukraine-context',label:'Ukraine context',kind:'conflict-context',countryCodes:['UA','RU'],keywordAliases:['Ukraine','Russia','Україна','Украина'],provenanceUrl:'https://www.unocha.org/ukraine',checkedAt:'2026-10-05T23:02:06.872498+00:00',verification:'verified'},
 {id:'israel-palestine-context',label:'Israel / Palestine context',kind:'conflict-context',countryCodes:['IL','PS'],keywordAliases:['Israel','Palestine','Gaza'],provenanceUrl:'https://www.unocha.org/occupied-palestinian-territory',checkedAt:'2026-10-05T23:02:06.878222+00:00',verification:'verified'},
 {id:'gulf-iran-lens',label:'Gulf / Iran geographic lens',kind:'geographic-lens',countryCodes:['IR','SA'],keywordAliases:['Iran','Saudi Arabia','Gulf'],provenanceUrl:'https://www.un.org/en/about-us/member-states',checkedAt:null,verification:'unverified'},
 {id:'us-west-places',label:'US West: named places',kind:'named-place-lens',countryCodes:['US'],keywordAliases:['California','Oregon','Seattle','Los Angeles','San Francisco'],provenanceUrl:'https://www.usa.gov/',checkedAt:null,verification:'unverified'},
 {id:'us-northeast-places',label:'US Northeast: named places',kind:'named-place-lens',countryCodes:['US'],keywordAliases:['New York','Boston','Massachusetts','Pennsylvania'],provenanceUrl:'https://www.usa.gov/',checkedAt:null,verification:'unverified'},
 {id:'br-southeast-places',label:'Brazil Southeast: named places',kind:'named-place-lens',countryCodes:['BR'],keywordAliases:['São Paulo','Sao Paulo','Rio de Janeiro','Minas Gerais','Espírito Santo','Espirito Santo'],provenanceUrl:'https://www.gov.br/',checkedAt:null,verification:'unverified'},
 {id:'in-north-places',label:'India North: named places',kind:'named-place-lens',countryCodes:['IN'],keywordAliases:['New Delhi','Delhi','Punjab','Uttar Pradesh'],provenanceUrl:'https://www.india.gov.in/',checkedAt:null,verification:'unverified'},
 {id:'in-south-places',label:'India South: named places',kind:'named-place-lens',countryCodes:['IN'],keywordAliases:['Tamil Nadu','Kerala','Karnataka'],provenanceUrl:'https://www.india.gov.in/',checkedAt:null,verification:'unverified'},
 {id:'cn-east-places',label:'China East: named places',kind:'named-place-lens',countryCodes:['CN'],keywordAliases:['Shanghai','Jiangsu','Zhejiang','Shandong'],provenanceUrl:'https://english.www.gov.cn/',checkedAt:null,verification:'unverified'},
];
const mediaDirectory: Record<string, SignalWorldCatalogCountry['mediaOrganizations'][number]> = {
  "US": {
    "label": "Associated Press",
    "url": "https://apnews.com/",
    "provenanceUrl": "https://apnews.com/",
    "checkedAt": null,
    "verification": "unverified"
  },
  "GB": {
    "label": "BBC News",
    "url": "https://www.bbc.com/news",
    "provenanceUrl": "https://www.bbc.com/news",
    "checkedAt": "2026-10-05T23:02:10.654212+00:00",
    "verification": "verified"
  },
  "FR": {
    "label": "France 24",
    "url": "https://www.france24.com/en/",
    "provenanceUrl": "https://www.france24.com/en/",
    "checkedAt": null,
    "verification": "unverified"
  },
  "DE": {
    "label": "Deutsche Welle",
    "url": "https://www.dw.com/en/top-stories/s-9097",
    "provenanceUrl": "https://www.dw.com/en/",
    "checkedAt": "2026-10-05T23:02:10.700303+00:00",
    "verification": "verified"
  },
  "IT": {
    "label": "ANSA",
    "url": "https://www.ansa.it/english/",
    "provenanceUrl": "https://www.ansa.it/english/",
    "checkedAt": "2026-10-05T23:02:10.738626+00:00",
    "verification": "verified"
  },
  "CA": {
    "label": "CBC News",
    "url": "https://www.cbc.ca/news",
    "provenanceUrl": "https://www.cbc.ca/news",
    "checkedAt": "2026-10-05T23:02:11.022837+00:00",
    "verification": "verified"
  },
  "BR": {
    "label": "Agência Brasil",
    "url": "https://agenciabrasil.ebc.com.br/en",
    "provenanceUrl": "https://agenciabrasil.ebc.com.br/en",
    "checkedAt": "2026-10-05T23:02:11.142384+00:00",
    "verification": "verified"
  },
  "RU": {
    "label": "TASS",
    "url": "https://tass.com/",
    "provenanceUrl": "https://tass.com/",
    "checkedAt": "2026-10-05T23:02:11.168846+00:00",
    "verification": "verified"
  },
  "UA": {
    "label": "Ukrinform",
    "url": "https://www.ukrinform.net/",
    "provenanceUrl": "https://www.ukrinform.net/",
    "checkedAt": "2026-10-05T23:02:11.189955+00:00",
    "verification": "verified"
  },
  "CN": {
    "label": "Xinhua",
    "url": "https://english.news.cn/",
    "provenanceUrl": "https://english.news.cn/",
    "checkedAt": "2026-10-05T23:02:11.551049+00:00",
    "verification": "verified"
  },
  "JP": {
    "label": "NHK World Japan",
    "url": "https://www3.nhk.or.jp/nhkworld/en/",
    "provenanceUrl": "https://www3.nhk.or.jp/nhkworld/en/",
    "checkedAt": "2026-10-05T23:02:11.648176+00:00",
    "verification": "verified"
  },
  "KR": {
    "label": "Yonhap News Agency",
    "url": "https://en.yna.co.kr/",
    "provenanceUrl": "https://en.yna.co.kr/",
    "checkedAt": "2026-10-05T23:02:11.693613+00:00",
    "verification": "verified"
  },
  "IN": {
    "label": "The Hindu",
    "url": "https://www.thehindu.com/",
    "provenanceUrl": "https://www.thehindu.com/",
    "checkedAt": "2026-10-05T23:02:11.831304+00:00",
    "verification": "verified"
  },
  "ID": {
    "label": "ANTARA",
    "url": "https://en.antaranews.com/",
    "provenanceUrl": "https://en.antaranews.com/",
    "checkedAt": "2026-10-05T23:02:11.888980+00:00",
    "verification": "verified"
  },
  "TR": {
    "label": "Anadolu Agency",
    "url": "https://www.aa.com.tr/en",
    "provenanceUrl": "https://www.aa.com.tr/en",
    "checkedAt": "2026-10-05T23:02:12.081498+00:00",
    "verification": "verified"
  },
  "SA": {
    "label": "Arab News",
    "url": "https://www.arabnews.com/",
    "provenanceUrl": "https://www.arabnews.com/",
    "checkedAt": null,
    "verification": "unverified"
  },
  "IR": {
    "label": "IRNA",
    "url": "https://en.irna.ir/",
    "provenanceUrl": "https://en.irna.ir/",
    "checkedAt": null,
    "verification": "unverified"
  },
  "IL": {
    "label": "The Times of Israel",
    "url": "https://www.timesofisrael.com/",
    "provenanceUrl": "https://www.timesofisrael.com/",
    "checkedAt": null,
    "verification": "unverified"
  },
  "PS": {
    "label": "WAFA",
    "url": "https://english.wafa.ps/",
    "provenanceUrl": "https://english.wafa.ps/",
    "checkedAt": "2026-10-05T23:02:12.342049+00:00",
    "verification": "verified"
  },
  "ZA": {
    "label": "SABC News",
    "url": "https://www.sabcnews.com/sabcnews/",
    "provenanceUrl": "https://www.sabcnews.com/",
    "checkedAt": "2026-10-05T23:02:12.361550+00:00",
    "verification": "verified"
  }
};
export const SIGNAL_WORLD_CATALOG: SignalWorldCatalogCountry[] = rows.map(([code,worldBankCode,name,region,url,label]) => ({ code,worldBankCode,name,region,conflictTags: SIGNAL_WORLD_LENSES.filter(lens=>lens.kind==='conflict-context'&&lens.countryCodes.includes(code)).map(lens=>lens.id), governmentPortals:[{label,url,provenanceUrl:url,checkedAt,verification:'unverified',...governmentChecks[code]}],mediaOrganizations:[{...mediaDirectory[code]}],feedIds:['global-voices','govuk-public-communications','european-commission-press'] }));
const titleAliases: Record<string,string[]> = { US:['United States','U.S.','USA'],GB:['United Kingdom','UK','U.K.','Britain','British'],FR:['France','French'],DE:['Germany','German'],IT:['Italy','Italian'],CA:['Canada','Canadian'],BR:['Brazil','Brazilian'],RU:['Russia','Russian'],UA:['Ukraine','Ukrainian'],CN:['China','Chinese'],JP:['Japan','Japanese'],KR:['South Korea','South Korean','Republic of Korea'],IN:['India','Indian'],ID:['Indonesia','Indonesian'],TR:['Türkiye','Turkiye','Turkish'],SA:['Saudi Arabia','Saudi'],IR:['Iran','Iranian'],IL:['Israel','Israeli'],PS:['Palestine','Palestinian','Gaza','West Bank'],ZA:['South Africa','South African'] };
/** Permission-checked publisher/institution title/link/time metadata, not complete national media coverage. */
export const SIGNAL_WORLD_FEEDS: SignalWorldFeed[] = [
 {id:'global-voices',label:'Global Voices',publisher:'Global Voices',url:'https://globalvoices.org/feed/',provenanceUrl:'https://globalvoices.org/about/global-voices-attribution-policy/',licenseUrl:'https://creativecommons.org/licenses/by/3.0/',license:'Global Voices: CC BY 3.0. Original author, story link and date attributed. Headline only; titles normalized to plain text and limited to 240 characters. No article bodies, descriptions, images or third-party media reused.',language:'en',countryCodes:rows.map(r=>r[0]),countryTerms:titleAliases,accessVerifiedAt:'2026-10-05',retentionPolicy:'title-link-time-approved',requireAuthor:true},
 {id:'govuk-public-communications',label:'GOV.UK official communications',publisher:'UK Government',licenseUrl:'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',url:'https://www.gov.uk/search/news-and-communications.atom',provenanceUrl:'https://www.gov.uk/help/terms-conditions',license:'UK government information: Open Government Licence v3.0, with attribution; headline titles normalized to plain text and limited to 240 characters; third-party content, personal data and logos excluded. https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',language:'en',countryCodes:rows.map(r=>r[0]),countryTerms:titleAliases,accessVerifiedAt:'2026-10-05',retentionPolicy:'title-link-time-approved'},
 {id:'european-commission-press',label:'European Commission official communications',publisher:'European Commission',licenseUrl:'https://creativecommons.org/licenses/by/4.0/',url:'https://ec.europa.eu/commission/presscorner/api/rss?language=en',provenanceUrl:'https://commission.europa.eu/legal-notice_en',license:'European Union-owned information: CC BY 4.0 with attribution; headline titles normalized to plain text and limited to 240 characters; third-party material excluded. https://commission.europa.eu/legal-notice_en',language:'en',countryCodes:rows.map(r=>r[0]),countryTerms:titleAliases,accessVerifiedAt:'2026-10-05',retentionPolicy:'title-link-time-approved'},
];
export const SIGNAL_WORLD_INDICATORS = [
 {indicator:'IT.NET.USER.ZS',label:'Internet users',unit:'% of population'},
 {indicator:'NY.GDP.PCAP.CD',label:'GDP per capita',unit:'current US$'},
 {indicator:'FP.CPI.TOTL.ZG',label:'Consumer price inflation',unit:'annual %'},
 {indicator:'SP.POP.TOTL',label:'Population',unit:'people'},
] as const;
export const SIGNAL_WORLD_LIMITATIONS = [
 'A curated 20-country starting panel, not an exhaustive map or geopolitical ranking. Government links are a directory. A checked/verified directory entry means its public endpoint responded at the recorded time, not verification of official statements, officeholders or reuse rights.',
 'Economic observations retain the actual reported year and may lag current events. Missing values remain unavailable. World Development Indicators is attributed under CC BY 4.0, with dataset-specific third-party exceptions; annual source years are retained.',
 'Headline observations sample Global Voices plus official GOV.UK and European Commission communications, using explicit title country mentions and author attribution where required. This is sparse publisher/institution discovery coverage, not a representative national media panel. Media organization directory links are curated inspection targets and do not establish ownership, independence or article reuse rights. Headlines do not establish substantive claims and are never automatically accepted as desk evidence.',
 'Topic counts describe sampled title mentions, not ideology, polarization, influence, public opinion, event prevalence or comprehensive media coverage.',
 'Conflict tags, if present, are curated directory filters with provenance; absence is not a claim of peace. No automated conflict classification is performed.',
];
