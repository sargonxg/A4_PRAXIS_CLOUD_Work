import type { CaseModule } from '@/types/case-module';
import type { ContextEpisode } from '@/types/episode';
import type { CanonicalSourceReceipt } from '@/types/source-receipt';
import type { SourceTier } from '@/lib/sources/tiers';

type SourceSeed = {
  title: string;
  url: string;
  provider: string;
  tier: SourceTier;
  kind?: CanonicalSourceReceipt['kind'];
  excerpt: string;
  publishedDate?: string;
};

type DemoContextSeed = {
  id: string;
  name: string;
  region: string;
  summary: string;
  domain: string;
  tags: string[];
  riskScore: number;
  glaslStage: number;
  actors: string[];
  sourceSeeds: SourceSeed[];
  situationEpisodes: Array<{ id: string; title: string; date: string; type: string }>;
  workEpisodes: Array<{ id: string; title: string; date: string; type: string }>;
  cachedResponses: CaseModule['cachedResponses'];
  graphCounts: { actors: number; claims: number; commitments: number; events: number };
};

const UPDATED_AT = '2026-05-11T02:00:00.000Z';

const INDO_PACIFIC_SOURCES: SourceSeed[] = [
  { title: 'Indo-Pacific Strategy of the United States', url: 'https://www.whitehouse.gov/wp-content/uploads/2022/02/U.S.-Indo-Pacific-Strategy.pdf', provider: 'White House', tier: 'T1', kind: 'document', publishedDate: '2022-02-11', excerpt: 'Primary strategy document for U.S. regional priorities and alliance posture.' },
  { title: 'The Quad Joint Leaders Statement', url: 'https://www.whitehouse.gov/briefing-room/statements-releases/2024/09/21/the-quad-leaders-summit-joint-statement/', provider: 'White House', tier: 'T1', publishedDate: '2024-09-21', excerpt: 'Primary statement for Quad cooperation and regional public goods.' },
  { title: 'AUKUS Defense Ministers Joint Statement', url: 'https://www.defense.gov/News/Releases/Release/Article/3987315/aukus-defense-ministers-joint-statement/', provider: 'U.S. Department of Defense', tier: 'T1', publishedDate: '2024-11-21', excerpt: 'Primary source on AUKUS defense-industrial and submarine cooperation.' },
  { title: 'Australia Defence Strategic Review', url: 'https://www.defence.gov.au/about/reviews-inquiries/defence-strategic-review', provider: 'Australian Department of Defence', tier: 'T1', publishedDate: '2023-04-24', excerpt: 'Primary regional defense posture review for Australian strategy.' },
  { title: 'Japan National Security Strategy', url: 'https://www.cas.go.jp/jp/siryou/221216anzenhoshou/nss-e.pdf', provider: 'Government of Japan', tier: 'T1', kind: 'document', publishedDate: '2022-12-16', excerpt: 'Primary Japanese security strategy and regional threat assessment.' },
  { title: 'Philippines National Security Policy 2023-2028', url: 'https://nsc.gov.ph/images/NSS_NSP/National_Security_Policy_2023_2028.pdf', provider: 'National Security Council Philippines', tier: 'T1', kind: 'document', publishedDate: '2023-08-10', excerpt: 'Primary national security framework for the Philippines.' },
  { title: 'Taiwan 2024 Presidential Election Results', url: 'https://www.cec.gov.tw/en/cms/pe2024', provider: 'Central Election Commission Taiwan', tier: 'T1', publishedDate: '2024-01-13', excerpt: 'Primary election result source for Taiwan leadership transition analysis.' },
  { title: 'China 2024 Government Work Report', url: 'https://english.www.gov.cn/2024special/governmentworkreport2024/', provider: 'State Council of China', tier: 'T1', publishedDate: '2024-03-05', excerpt: 'Primary Chinese government statement covering defense and economic priorities.' },
  { title: 'ASEAN Outlook on the Indo-Pacific', url: 'https://asean.org/asean-outlook-on-the-indo-pacific/', provider: 'ASEAN', tier: 'T1', publishedDate: '2019-06-23', excerpt: 'Primary ASEAN statement on regional principles and connectivity.' },
  { title: 'U.S.-Japan Joint Leaders Statement', url: 'https://www.whitehouse.gov/briefing-room/statements-releases/2024/04/10/united-states-japan-joint-leaders-statement/', provider: 'White House', tier: 'T1', publishedDate: '2024-04-10', excerpt: 'Primary alliance modernization and regional security statement.' },
  { title: 'World Bank Worldwide Governance Indicators', url: 'https://www.worldbank.org/en/publication/worldwide-governance-indicators', provider: 'World Bank', tier: 'T2', kind: 'structured-data', excerpt: 'Structured governance indicators for Indo-Pacific state comparison.' },
  { title: 'V-Dem Democracy Reports', url: 'https://www.v-dem.net/publications/democracy-reports/', provider: 'V-Dem Institute', tier: 'T2', kind: 'structured-data', excerpt: 'Structured regime and democracy indicators for regional political context.' },
  { title: 'SIPRI Military Expenditure Database', url: 'https://www.sipri.org/databases/milex', provider: 'SIPRI', tier: 'T2', kind: 'structured-data', excerpt: 'Structured defense spending data for regional military trend analysis.' },
  { title: 'IISS Shangri-La Dialogue', url: 'https://www.iiss.org/events/shangri-la-dialogue/', provider: 'IISS', tier: 'T3', excerpt: 'Expert forum material on Indo-Pacific defense and diplomatic signaling.' },
  { title: 'RAND Indo-Pacific Research', url: 'https://www.rand.org/topics/indo-pacific.html', provider: 'RAND Corporation', tier: 'T3', excerpt: 'Expert research collection on regional security and competition.' },
  { title: 'International Crisis Group Asia', url: 'https://www.crisisgroup.org/asia', provider: 'International Crisis Group', tier: 'T3', excerpt: 'Conflict-prevention analysis covering Asian flashpoints and regional diplomacy.' },
  { title: 'CSIS Asia Maritime Transparency Initiative', url: 'https://amti.csis.org/', provider: 'CSIS AMTI', tier: 'T3', excerpt: 'Expert maritime feature tracking and South China Sea analysis.' },
  { title: 'CFR China and the Indo-Pacific', url: 'https://www.cfr.org/asia/china', provider: 'Council on Foreign Relations', tier: 'T3', excerpt: 'Expert background and analysis on China regional policy.' },
  { title: 'Brookings Center for Asia Policy Studies', url: 'https://www.brookings.edu/center/center-for-asia-policy-studies/', provider: 'Brookings Institution', tier: 'T3', excerpt: 'Expert policy analysis on Asian security and economics.' },
  { title: 'Lowy Institute Indo-Pacific research', url: 'https://www.lowyinstitute.org/issues/indo-pacific', provider: 'Lowy Institute', tier: 'T3', excerpt: 'Regional expert commentary and research on Indo-Pacific strategy.' },
  { title: 'Carnegie Asia Program', url: 'https://carnegieendowment.org/programs/asia', provider: 'Carnegie Endowment', tier: 'T3', excerpt: 'Expert research on Asian politics, technology, and security.' },
  { title: 'Foreign Affairs Indo-Pacific', url: 'https://www.foreignaffairs.com/regions/indo-pacific', provider: 'Foreign Affairs', tier: 'T3', excerpt: 'Expert commentary for strategic competition and regional order.' },
  { title: 'Foreign Policy Asia coverage', url: 'https://foreignpolicy.com/category/regions/asia/', provider: 'Foreign Policy', tier: 'T3', excerpt: 'Expert and reported analysis on regional diplomacy and security.' },
  { title: 'Reuters Asia Pacific', url: 'https://www.reuters.com/world/asia-pacific/', provider: 'Reuters', tier: 'T4', excerpt: 'Reported source stream for current regional developments.' },
  { title: 'Nikkei Asia Politics', url: 'https://asia.nikkei.com/Politics', provider: 'Nikkei Asia', tier: 'T4', excerpt: 'Regional reporting on Indo-Pacific politics and economics.' },
  { title: 'AP Asia Pacific', url: 'https://apnews.com/hub/asia-pacific', provider: 'Associated Press', tier: 'T4', excerpt: 'Reported current events coverage for Asia-Pacific developments.' },
  { title: 'Defense News Indo-Pacific', url: 'https://www.defensenews.com/global/asia-pacific/', provider: 'Defense News', tier: 'T4', excerpt: 'Reported defense procurement and military posture coverage.' },
  { title: 'Wikidata Taiwan', url: 'https://www.wikidata.org/wiki/Q865', provider: 'Wikidata', tier: 'T2', kind: 'structured-data', excerpt: 'Structured entity anchor for Taiwan actor records.' },
  { title: 'Wikidata Quad Security Dialogue', url: 'https://www.wikidata.org/wiki/Q7267594', provider: 'Wikidata', tier: 'T2', kind: 'structured-data', excerpt: 'Structured entity anchor for Quad actor relationships.' },
  { title: 'Wikidata AUKUS', url: 'https://www.wikidata.org/wiki/Q108130835', provider: 'Wikidata', tier: 'T2', kind: 'structured-data', excerpt: 'Structured entity anchor for AUKUS actor relationships.' },
];

const AI_REGULATION_SOURCES: SourceSeed[] = [
  { title: 'NIST AI Risk Management Framework', url: 'https://www.nist.gov/itl/ai-risk-management-framework', provider: 'NIST', tier: 'T1', publishedDate: '2023-01-26', excerpt: 'Primary risk-management framework for U.S. AI governance.' },
  { title: 'NIST AI Congressional Mandates and Executive Orders', url: 'https://www.nist.gov/artificial-intelligence/ai-congressional-mandates-executive-orders-and-actions', provider: 'NIST', tier: 'T1', excerpt: 'Primary NIST tracker for congressional mandates and executive actions.' },
  { title: 'Executive Order 14110', url: 'https://www.federalregister.gov/documents/2023/11/01/2023-24283/safe-secure-and-trustworthy-development-and-use-of-artificial-intelligence', provider: 'Federal Register', tier: 'T1', publishedDate: '2023-11-01', excerpt: 'Primary federal order on safe, secure, trustworthy AI development.' },
  { title: 'Executive Order 14179', url: 'https://www.federalregister.gov/documents/2025/01/31/2025-02172/removing-barriers-to-american-leadership-in-artificial-intelligence', provider: 'Federal Register', tier: 'T1', publishedDate: '2025-01-31', excerpt: 'Primary federal order changing federal AI policy posture.' },
  { title: 'OMB Memorandum M-24-10', url: 'https://www.whitehouse.gov/omb/management/memo/m-24-10/', provider: 'Office of Management and Budget', tier: 'T1', publishedDate: '2024-03-28', excerpt: 'Primary federal agency governance guidance for AI use.' },
  { title: 'AI.gov', url: 'https://ai.gov/', provider: 'U.S. Government', tier: 'T1', excerpt: 'Primary federal portal for AI policy and implementation material.' },
  { title: 'NTIA AI Accountability Policy Report', url: 'https://www.ntia.gov/report/2024/artificial-intelligence-accountability-policy-report', provider: 'NTIA', tier: 'T1', publishedDate: '2024-03-27', excerpt: 'Primary federal report on AI accountability policy.' },
  { title: 'FTC AI Guidance', url: 'https://www.ftc.gov/business-guidance/technology/artificial-intelligence', provider: 'Federal Trade Commission', tier: 'T1', excerpt: 'Primary enforcement and business guidance for AI claims and uses.' },
  { title: 'EEOC AI and Algorithmic Fairness', url: 'https://www.eeoc.gov/ai', provider: 'Equal Employment Opportunity Commission', tier: 'T1', excerpt: 'Primary federal employment-discrimination guidance for AI tools.' },
  { title: 'CFPB Circular on adverse action notices and algorithms', url: 'https://www.consumerfinance.gov/compliance/circulars/circular-2023-03-adverse-action-notification-requirements-and-the-proper-use-of-the-cfpbs-sample-forms-provided-in-regulation-b/', provider: 'Consumer Financial Protection Bureau', tier: 'T1', publishedDate: '2023-09-19', excerpt: 'Primary consumer-finance guidance on algorithmic decision notices.' },
  { title: 'CRS Regulating Artificial Intelligence', url: 'https://www.congress.gov/crs-product/R48555', provider: 'Congressional Research Service', tier: 'T3', publishedDate: '2025-06-01', excerpt: 'Congressional research synthesis on U.S. and international AI regulation.' },
  { title: 'GAO Artificial Intelligence', url: 'https://www.gao.gov/artificial-intelligence', provider: 'Government Accountability Office', tier: 'T3', excerpt: 'GAO audits and explainers on federal AI adoption and oversight.' },
  { title: 'EU AI Act', url: 'https://artificialintelligenceact.eu/the-act/', provider: 'EU AI Act Office / Future of Life Institute', tier: 'T1', excerpt: 'Public text and implementation tracker for EU AI Act obligations.' },
  { title: 'European Commission AI Act', url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai', provider: 'European Commission', tier: 'T1', excerpt: 'Primary EU implementation material for the AI Act.' },
  { title: 'Colorado AI Act', url: 'https://leg.colorado.gov/bills/sb24-205', provider: 'Colorado General Assembly', tier: 'T1', publishedDate: '2024-05-17', excerpt: 'Primary state law for high-risk AI governance and discrimination controls.' },
  { title: 'California AI legislation portal', url: 'https://leginfo.legislature.ca.gov/', provider: 'California Legislature', tier: 'T1', excerpt: 'Primary legislative source for California AI bills and enacted statutes.' },
  { title: 'New York Senate legislation portal', url: 'https://www.nysenate.gov/legislation', provider: 'New York State Senate', tier: 'T1', excerpt: 'Primary source for New York AI bills and status tracking.' },
  { title: 'Illinois Artificial Intelligence Video Interview Act', url: 'https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=4015&ChapterID=68', provider: 'Illinois General Assembly', tier: 'T1', excerpt: 'Primary state statute for AI in video interview contexts.' },
  { title: 'Texas Legislature Online', url: 'https://capitol.texas.gov/', provider: 'Texas Legislature', tier: 'T1', excerpt: 'Primary legislative source for Texas AI bills and policy changes.' },
  { title: 'OpenAI policy research', url: 'https://openai.com/policies/', provider: 'OpenAI', tier: 'T3', excerpt: 'Company policy material and governance statements for industry-position mapping.' },
  { title: 'Anthropic policy', url: 'https://www.anthropic.com/policy', provider: 'Anthropic', tier: 'T3', excerpt: 'Company policy material for frontier model governance mapping.' },
  { title: 'Google AI Responsibility', url: 'https://ai.google/responsibility/', provider: 'Google', tier: 'T3', excerpt: 'Company responsible AI and policy material for industry-position mapping.' },
  { title: 'Microsoft Responsible AI', url: 'https://www.microsoft.com/ai/responsible-ai', provider: 'Microsoft', tier: 'T3', excerpt: 'Company responsible AI material for industry-position mapping.' },
  { title: 'Meta Responsible AI', url: 'https://ai.meta.com/responsible-ai/', provider: 'Meta', tier: 'T3', excerpt: 'Company responsible AI material for industry-position mapping.' },
  { title: 'IBM AI Ethics', url: 'https://www.ibm.com/artificial-intelligence/ethics', provider: 'IBM', tier: 'T3', excerpt: 'Company AI ethics material for enterprise governance mapping.' },
  { title: 'EFF AI and Machine Learning', url: 'https://www.eff.org/issues/ai', provider: 'Electronic Frontier Foundation', tier: 'T3', excerpt: 'Civil-society advocacy and rights framing for AI policy.' },
  { title: 'ACLU Artificial Intelligence', url: 'https://www.aclu.org/issues/privacy-technology/artificial-intelligence', provider: 'ACLU', tier: 'T3', excerpt: 'Civil-rights policy framing for AI governance and surveillance.' },
  { title: 'AI Now Institute', url: 'https://ainowinstitute.org/', provider: 'AI Now Institute', tier: 'T3', excerpt: 'Civil-society research on accountability and political economy of AI.' },
  { title: 'Brookings AI governance', url: 'https://www.brookings.edu/topics/artificial-intelligence/', provider: 'Brookings Institution', tier: 'T3', excerpt: 'Expert policy analysis on AI regulation and governance.' },
  { title: 'AEI Artificial Intelligence', url: 'https://www.aei.org/tag/artificial-intelligence/', provider: 'American Enterprise Institute', tier: 'T3', excerpt: 'Expert policy commentary on AI and innovation regulation.' },
];

const FOOD_BEVERAGE_SOURCES: SourceSeed[] = [
  { title: 'FDA Human Foods Program', url: 'https://www.fda.gov/food', provider: 'Food and Drug Administration', tier: 'T1', excerpt: 'Primary U.S. food safety and labeling policy source.' },
  { title: 'FDA Food Labeling and Nutrition', url: 'https://www.fda.gov/food/food-labeling-nutrition', provider: 'Food and Drug Administration', tier: 'T1', excerpt: 'Primary labeling, nutrition, and claims source for U.S. food policy.' },
  { title: 'USDA Food Safety and Inspection Service', url: 'https://www.fsis.usda.gov/', provider: 'USDA FSIS', tier: 'T1', excerpt: 'Primary source for meat, poultry, and egg product regulation.' },
  { title: 'USDA Agricultural Marketing Service', url: 'https://www.ams.usda.gov/', provider: 'USDA AMS', tier: 'T1', excerpt: 'Primary source for organic, labeling, and commodity program standards.' },
  { title: 'EPA Food Recovery Hierarchy', url: 'https://www.epa.gov/sustainable-management-food/food-recovery-hierarchy', provider: 'Environmental Protection Agency', tier: 'T1', excerpt: 'Primary federal source for food waste and recovery policy.' },
  { title: 'EPA Greenhouse Gas Reporting Program', url: 'https://www.epa.gov/ghgreporting', provider: 'Environmental Protection Agency', tier: 'T2', kind: 'structured-data', excerpt: 'Structured federal source for facility emissions reporting.' },
  { title: 'SEC Climate Disclosure Rules', url: 'https://www.sec.gov/rules-regulations/2024/03/s7-10-22', provider: 'Securities and Exchange Commission', tier: 'T1', publishedDate: '2024-03-06', excerpt: 'Primary federal source for climate disclosure rule posture.' },
  { title: 'GHG Protocol', url: 'https://ghgprotocol.org/', provider: 'GHG Protocol', tier: 'T1', excerpt: 'Primary accounting standard source for greenhouse gas inventories.' },
  { title: 'GRI Standards', url: 'https://www.globalreporting.org/standards/', provider: 'Global Reporting Initiative', tier: 'T1', excerpt: 'Primary sustainability reporting standard source.' },
  { title: 'SASB Standards', url: 'https://sasb.ifrs.org/standards/', provider: 'IFRS Foundation', tier: 'T1', excerpt: 'Primary industry disclosure standards for financially material sustainability topics.' },
  { title: 'ISSB Standards', url: 'https://www.ifrs.org/issued-standards/ifrs-sustainability-standards-navigator/', provider: 'IFRS Foundation', tier: 'T1', excerpt: 'Primary global sustainability-disclosure standards source.' },
  { title: 'TCFD Recommendations', url: 'https://www.fsb-tcfd.org/recommendations/', provider: 'Task Force on Climate-related Financial Disclosures', tier: 'T1', excerpt: 'Primary climate-disclosure recommendation source.' },
  { title: 'Nestle Sustainability', url: 'https://www.nestle.com/sustainability', provider: 'Nestle', tier: 'T3', excerpt: 'Corporate sustainability commitment source for food-sector actor mapping.' },
  { title: 'PepsiCo ESG Summary', url: 'https://www.pepsico.com/our-impact/esg-topics-a-z', provider: 'PepsiCo', tier: 'T3', excerpt: 'Corporate ESG source for commitments and reporting posture.' },
  { title: 'Unilever Sustainability', url: 'https://www.unilever.com/planet-and-society/', provider: 'Unilever', tier: 'T3', excerpt: 'Corporate sustainability source for commitments and claims.' },
  { title: 'Tyson Foods Sustainability', url: 'https://www.tysonfoods.com/sustainability', provider: 'Tyson Foods', tier: 'T3', excerpt: 'Corporate sustainability source for protein-sector exposure.' },
  { title: 'Cargill Sustainability', url: 'https://www.cargill.com/sustainability', provider: 'Cargill', tier: 'T3', excerpt: 'Corporate sustainability source for agricultural supply-chain exposure.' },
  { title: 'ADM Sustainability', url: 'https://www.adm.com/en-us/sustainability/', provider: 'ADM', tier: 'T3', excerpt: 'Corporate sustainability source for agricultural processing exposure.' },
  { title: 'Mars Sustainability', url: 'https://www.mars.com/sustainability-plan', provider: 'Mars', tier: 'T3', excerpt: 'Corporate sustainability source for commitments and supply-chain posture.' },
  { title: 'Coca-Cola Sustainability', url: 'https://www.coca-colacompany.com/sustainability', provider: 'The Coca-Cola Company', tier: 'T3', excerpt: 'Corporate sustainability source for packaging, water, and climate commitments.' },
  { title: 'Walmart Sustainability', url: 'https://corporate.walmart.com/purpose/sustainability', provider: 'Walmart', tier: 'T3', excerpt: 'Retailer sustainability commitments relevant to supplier pressure.' },
  { title: 'Costco Sustainability Commitment', url: 'https://www.costco.com/sustainability.html', provider: 'Costco', tier: 'T3', excerpt: 'Retailer sustainability and sourcing commitments.' },
  { title: 'Whole Foods Market Quality Standards', url: 'https://www.wholefoodsmarket.com/quality-standards', provider: 'Whole Foods Market', tier: 'T3', excerpt: 'Retailer quality and sourcing standards relevant to food-sector compliance.' },
  { title: 'EWG Food and Agriculture', url: 'https://www.ewg.org/foodnews/', provider: 'Environmental Working Group', tier: 'T3', excerpt: 'NGO campaign and consumer-facing pressure source.' },
  { title: 'CSPI Food Labeling', url: 'https://www.cspinet.org/topics/food-labeling', provider: 'Center for Science in the Public Interest', tier: 'T3', excerpt: 'NGO policy source for labeling and nutrition advocacy.' },
  { title: 'FAIRR Initiative', url: 'https://www.fairr.org/', provider: 'FAIRR Initiative', tier: 'T3', excerpt: 'Investor network source on food-sector sustainability and protein risk.' },
  { title: 'Rabobank Food & Agribusiness Research', url: 'https://research.rabobank.com/far/en/home/index.html', provider: 'Rabobank', tier: 'T3', excerpt: 'Industry analyst research source for food and agribusiness trends.' },
  { title: 'McKinsey Agriculture and Food', url: 'https://www.mckinsey.com/industries/agriculture/our-insights', provider: 'McKinsey & Company', tier: 'T3', excerpt: 'Industry analyst source on food-system economics and sustainability.' },
  { title: 'BlackRock Investment Stewardship', url: 'https://www.blackrock.com/corporate/about-us/investment-stewardship', provider: 'BlackRock', tier: 'T3', excerpt: 'Investor stewardship source for corporate governance pressure.' },
  { title: 'Ceres Food Emissions 50', url: 'https://www.ceres.org/accelerator/food-emissions-50', provider: 'Ceres', tier: 'T3', excerpt: 'Investor/NGO source tracking food-sector emissions commitments.' },
];

const DEMO_SEEDS: DemoContextSeed[] = [
  {
    id: 'indo-pacific-2026',
    name: 'Indo-Pacific Strategic Competition 2026',
    region: 'Indo-Pacific',
    summary: 'Alliance modernization, Taiwan Strait risk, maritime coercion, and regional hedging across the Indo-Pacific.',
    domain: 'Conflict',
    tags: ['foreign-policy', 'great-power-competition', 'maritime-security', 'demo-v5'],
    riskScore: 72,
    glaslStage: 4,
    actors: ['United States', 'China', 'Taiwan', 'Japan', 'Australia', 'India', 'Philippines', 'ASEAN', 'Quad', 'AUKUS'],
    sourceSeeds: INDO_PACIFIC_SOURCES,
    graphCounts: { actors: 34, claims: 92, commitments: 31, events: 14 },
    situationEpisodes: [
      { id: 'taiwan-election', title: 'Taiwan presidential transition', date: '2024-01-13', type: 'election' },
      { id: 'us-japan-summit', title: 'U.S.-Japan alliance modernization', date: '2024-04-10', type: 'summit' },
      { id: 'quad-2024', title: 'Quad leaders update regional public goods agenda', date: '2024-09-21', type: 'summit' },
      { id: 'aukus-industrial-base', title: 'AUKUS defense-industrial coordination expands', date: '2024-11-21', type: 'defense' },
      { id: 'philippines-maritime', title: 'Philippines maritime incidents remain core escalation signal', date: '2025-03-01', type: 'security' },
      { id: 'shangri-la-cycle', title: 'Shangri-La signaling cycle opens', date: '2025-06-01', type: 'diplomacy' },
      { id: 'taiwan-deterrence', title: 'Taiwan deterrence and gray-zone activity review', date: '2025-10-01', type: 'assessment' },
      { id: 'supply-chain-resilience', title: 'Critical minerals and semiconductor resilience review', date: '2026-01-15', type: 'economics' },
    ],
    workEpisodes: [
      { id: 'think-tank-cycle', title: 'Think-tank publication cycle', date: '2026-02-01', type: 'analysis-cycle' },
      { id: 'conference-briefing', title: 'Regional security conference briefing prep', date: '2026-03-01', type: 'briefing' },
      { id: 'principal-memo', title: 'Principal memo and public commentary package', date: '2026-04-15', type: 'drafting' },
    ],
    cachedResponses: [
      cached('ip-q1', "What's changed in Indo-Pacific dynamics this month?", 'Alliance signaling is outpacing institutional absorption: Quad public-goods language remains stable, but AUKUS industrial coordination and Philippine maritime risk make deterrence credibility the near-term watchpoint.', '/app/tools?method=deep-research-agent'),
      cached('ip-q2', 'Show me the stakeholder power-interest map.', 'Power-interest map: the United States, Japan, Australia, India, China, Taiwan, Philippines, and ASEAN split across deterrence, autonomy, trade resilience, and escalation-management interests.', '/app/tools?method=stakeholder-power-interest-map'),
      cached('ip-q3', 'Draft a 1-page think-tank country card on Taiwan dynamics.', 'Taiwan card draft: leadership continuity raises policy predictability, while gray-zone coercion, semiconductor exposure, and alliance signaling define the main analytic watchpoints.', '/app/workbench/indo-pacific-2026?openChapter=memos'),
    ],
  },
  {
    id: 'ai-regulation-2026',
    name: 'AI Regulation 2026 - US Federal and State Landscape',
    region: 'United States',
    summary: 'Federal preemption debate, state AI laws, NIST governance anchors, and industry/civil-society coalition positions.',
    domain: 'Domestic Policy Analysis',
    tags: ['domestic-policy', 'ai-regulation', 'legislation', 'demo-v5'],
    riskScore: 63,
    glaslStage: 3,
    actors: ['White House', 'Congress', 'NIST', 'FTC', 'Colorado', 'California', 'OpenAI', 'Anthropic', 'Google', 'ACLU'],
    sourceSeeds: AI_REGULATION_SOURCES,
    graphCounts: { actors: 43, claims: 112, commitments: 34, events: 16 },
    situationEpisodes: [
      { id: 'eo-14110', title: 'EO 14110 sets federal AI safety agenda', date: '2023-10-30', type: 'executive-action' },
      { id: 'nist-rmf', title: 'NIST AI RMF becomes governance anchor', date: '2023-01-26', type: 'standard' },
      { id: 'omb-memo', title: 'OMB M-24-10 sets agency AI governance rules', date: '2024-03-28', type: 'agency-guidance' },
      { id: 'colorado-ai-act', title: 'Colorado AI Act signed', date: '2024-05-17', type: 'state-law' },
      { id: 'eu-ai-act-force', title: 'EU AI Act enters force', date: '2024-08-01', type: 'international-law' },
      { id: 'eo-14179', title: 'Federal AI policy shifts toward innovation posture', date: '2025-01-23', type: 'executive-action' },
      { id: 'state-preemption', title: 'Federal-state preemption debate intensifies', date: '2025-12-11', type: 'legislative-debate' },
      { id: 'congress-2026', title: 'Congress considers national AI framework options', date: '2026-03-20', type: 'legislative-cycle' },
    ],
    workEpisodes: [
      { id: 'hearing-prep', title: 'Senate staff hearing preparation', date: '2026-02-10', type: 'briefing' },
      { id: 'coalition-map', title: 'Industry and civil-society coalition map', date: '2026-03-05', type: 'stakeholder-analysis' },
      { id: 'bill-redlines', title: 'Preemption bill redlines and policy memo', date: '2026-04-15', type: 'drafting' },
    ],
    cachedResponses: [
      cached('ai-q1', "What's the current state of US federal AI regulation?", 'The U.S. remains a federal-guidance plus state-law patchwork: NIST and agency guidance anchor governance while Congress and the White House contest whether state AI rules should be preempted.', '/app/tools?method=deep-research-agent'),
      cached('ai-q2', 'Map industry positions vs underlying interests on AI safety.', 'Industry positions cluster around uniform federal rules and liability predictability; civil-society actors emphasize rights, discrimination controls, transparency, and enforcement durability.', '/app/tools?method=position-interest-decoder'),
      cached('ai-q3', 'Draft a legislative briefing for a Senate staffer on AI regulation pre-emption.', 'Briefing draft: define the preemption question, map state-law stakes, identify constitutional and implementation risks, and offer options that preserve room for child-safety and civil-rights safeguards.', '/app/workbench/ai-regulation-2026?openChapter=memos'),
    ],
  },
  {
    id: 'fb-sustainability-2026',
    name: 'Food and Beverage Regulatory and Sustainability Outlook 2026',
    region: 'United States / Global Supply Chains',
    summary: 'Food labeling, climate disclosure, packaging, food waste, investor stewardship, and supplier sustainability commitments.',
    domain: 'Corporate Strategic Analysis',
    tags: ['corporate-strategy', 'food-beverage', 'sustainability', 'regulatory-risk', 'demo-v5'],
    riskScore: 58,
    glaslStage: 2,
    actors: ['FDA', 'USDA', 'EPA', 'SEC', 'Nestle', 'PepsiCo', 'Unilever', 'Tyson Foods', 'Walmart', 'Ceres'],
    sourceSeeds: FOOD_BEVERAGE_SOURCES,
    graphCounts: { actors: 38, claims: 88, commitments: 33, events: 11 },
    situationEpisodes: [
      { id: 'sec-climate', title: 'SEC climate disclosure rule posture', date: '2024-03-06', type: 'rulemaking' },
      { id: 'fda-foods', title: 'FDA Human Foods Program implementation cycle', date: '2024-10-01', type: 'agency-cycle' },
      { id: 'issb-adoption', title: 'ISSB disclosure alignment pressure grows', date: '2025-01-15', type: 'standard' },
      { id: 'retailer-supplier', title: 'Retailer supplier sustainability pressure review', date: '2025-04-01', type: 'market-signal' },
      { id: 'packaging-policy', title: 'Packaging and food-waste policy attention rises', date: '2025-07-01', type: 'policy-signal' },
      { id: 'investor-season', title: 'Investor stewardship and proxy-season scrutiny', date: '2025-10-01', type: 'investor-cycle' },
      { id: 'labeling-review', title: 'Labeling and consumer-claims risk review', date: '2026-02-01', type: 'compliance-cycle' },
      { id: 'board-outlook', title: 'Board outlook package for regulatory exposure', date: '2026-04-01', type: 'board-cycle' },
    ],
    workEpisodes: [
      { id: 'board-briefing', title: 'Board briefing cycle', date: '2026-02-20', type: 'briefing' },
      { id: 'investor-call', title: 'Investor call and stewardship prep', date: '2026-03-15', type: 'engagement' },
      { id: 'trade-association', title: 'Trade association policy position review', date: '2026-04-20', type: 'coalition' },
    ],
    cachedResponses: [
      cached('fb-q1', 'Track sustainability commitments by F&B majors and compliance.', 'Commitment tracking should separate climate, packaging, water, sourcing, and nutrition claims; investor and regulator pressure is strongest where disclosures meet consumer-facing claims.', '/app/tools?method=commitment-tracker'),
      cached('fb-q2', 'Map stakeholder positions on FDA labeling reform.', 'Stakeholder positions split across consumer transparency, compliance burden, public-health evidence, and brand-risk management; retailers can amplify pressure faster than formal rules.', '/app/tools?method=stakeholder-power-interest-map'),
      cached('fb-q3', 'Draft a board briefing on F&B regulatory and ESG exposure.', 'Board briefing draft: lead with material regulatory exposure, then show claims-risk, disclosure-risk, supplier-risk, and recommended governance actions with source posture visible.', '/app/workbench/fb-sustainability-2026?openChapter=memos'),
    ],
  },
];

export const V5_DEMO_CASE_MODULES: CaseModule[] = DEMO_SEEDS.map(toCaseModule);

export function getV5DemoCaseModule(id: string): CaseModule | undefined {
  return V5_DEMO_CASE_MODULES.find((demo) => demo.id === id);
}

function toCaseModule(seed: DemoContextSeed): CaseModule {
  const sources = seed.sourceSeeds.map((source, index) => toReceipt(seed.id, source, index));
  const episodes = buildEpisodes(seed);

  return {
    id: seed.id,
    kind: 'example',
    manifest: {
      name: seed.name,
      region: seed.region,
      summary: seed.summary,
      risk: seed.riskScore,
      glaslStage: seed.glaslStage,
      domain: seed.domain,
      tags: seed.tags,
    },
    situation: {
      id: seed.id,
      name: seed.name,
      type: seed.id === 'ai-regulation-2026' ? 'political' : seed.id === 'fb-sustainability-2026' ? 'trade' : 'international',
      description: seed.summary,
      region: seed.region,
      actors: seed.actors,
      userRole: seed.id === 'fb-sustainability-2026' ? 'advisor' : 'analyst',
      status: 'active',
      riskScore: seed.riskScore,
      glaslStage: seed.glaslStage,
      escalationTrend: seed.riskScore > 65 ? 'volatile' : 'stable',
      actorCount: seed.graphCounts.actors,
      graphEntities: seed.graphCounts.actors + seed.graphCounts.claims + seed.graphCounts.commitments + seed.graphCounts.events,
      documentCount: sources.length,
      sourceUrls: sources.map((source) => source.url).filter(Boolean) as string[],
      contextNotes: 'PRAXIS v5 demo Context seeded from public source receipts. Demo data is cached and read-only unless copied into a user workspace.',
      createdAt: '2026-01-15T09:00:00.000Z',
      updatedAt: UPDATED_AT,
      keyDates: seed.situationEpisodes.slice(0, 6).map((episode) => ({ date: episode.date, label: episode.title, significance: 'medium' as const })),
      tags: seed.tags,
      analysisPhase: 'assessment',
      dataCompleteness: 0.86,
      domain: seed.domain,
      workflowPath: seed.id,
      workflowPathLabel: seed.name,
    },
    sources,
    episodes,
    cachedResponses: seed.cachedResponses,
    truthLayers: {
      source: { nodeCount: sources.length, edgeCount: sources.length + 12, confidenceMin: 0.55, confidenceMax: 0.95, lastUpdated: UPDATED_AT, provenanceCoverage: 1 },
      claim: { nodeCount: seed.graphCounts.claims, edgeCount: seed.graphCounts.claims + 34, confidenceMin: 0.58, confidenceMax: 0.9, lastUpdated: UPDATED_AT, provenanceCoverage: 0.88 },
      evidence: { nodeCount: sources.length + seed.graphCounts.events, edgeCount: sources.length * 2, confidenceMin: 0.55, confidenceMax: 0.88, lastUpdated: UPDATED_AT, provenanceCoverage: 0.9 },
      verdict: { nodeCount: seed.graphCounts.commitments, edgeCount: seed.graphCounts.commitments + 18, confidenceMin: 0.6, confidenceMax: 0.84, lastUpdated: UPDATED_AT, provenanceCoverage: 0.86 },
    },
  };
}

function toReceipt(contextId: string, source: SourceSeed, index: number): CanonicalSourceReceipt {
  const receiptId = `${contextId}-source-${String(index + 1).padStart(2, '0')}`;
  return {
    receiptId,
    sourceId: receiptId,
    name: source.title,
    title: source.title,
    url: source.url,
    provider: source.provider,
    source: source.provider,
    kind: source.kind ?? 'web-result',
    retrievalMethod: source.kind === 'structured-data' ? 'structured_data' : source.kind === 'document' ? 'document' : 'web_search',
    timestamp: UPDATED_AT,
    publishedDate: source.publishedDate,
    reliabilityScore: source.tier === 'T1' ? 0.94 : source.tier === 'T2' ? 0.86 : source.tier === 'T3' ? 0.75 : 0.64,
    confidence: source.tier === 'T4' ? 'medium' : 'high',
    tier: source.tier,
    excerpt: source.excerpt,
    contentHash: `${contextId}-${index + 1}`,
    graphPath: ['demo', contextId, source.tier, slug(source.provider)],
    toolRunId: `${contextId}-phase7-seed`,
  };
}

function buildEpisodes(seed: DemoContextSeed): ContextEpisode[] {
  return [
    ...seed.situationEpisodes.map((episode): ContextEpisode => ({
      id: `${seed.id}-${episode.id}`,
      caseId: seed.id,
      episodeId: episode.id,
      ownerUid: '_demo',
      strand: 'situation',
      episodeType: episode.type,
      title: episode.title,
      validFrom: `${episode.date}T00:00:00.000Z`,
      metadata: { source: 'phase7-demo-seed' },
    })),
    ...seed.workEpisodes.map((episode): ContextEpisode => ({
      id: `${seed.id}-${episode.id}`,
      caseId: seed.id,
      episodeId: episode.id,
      ownerUid: '_demo',
      strand: 'work',
      episodeType: episode.type,
      title: episode.title,
      validFrom: `${episode.date}T00:00:00.000Z`,
      metadata: { source: 'phase7-demo-seed' },
    })),
  ];
}

function cached(questionId: string, question: string, response: string, targetPath: string): NonNullable<CaseModule['cachedResponses']>[number] {
  return { questionId, question, response, targetPath, latencyTargetMs: 200 };
}

function slug(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
