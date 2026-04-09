'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { buildSituationContext } from '@/lib/ai/situation-context';
import type { Situation } from '@/types/situation';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  Sparkles,
  MessageSquare,
  Send,
  X,
  Loader2,
  Users,
  ChevronRight,
  ChevronDown,
  BookOpen,
  ExternalLink,
  Zap,
  Shield,
  Star,
  CheckSquare,
  Square,
  Download,
  FileText,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { parseDataStreamChunk } from '@/lib/utils/stream';

import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';
// ============================================================================
// Advisor definitions — 10 experts with full metadata
// ============================================================================

interface AdvisorResource {
  name: string;
  url: string;
  description: string;
}

interface AdvisorDef {
  id: string;
  name: string;
  title: string;
  expertise: string;
  avatar: string;
  color: string;
  bio: string;
  systemPrompt: string;
  suggestedPrompts: string[];
  resources: AdvisorResource[];
  /** Topics this advisor tends to agree with others on */
  alignsWith: string[];
  /** Topics where this advisor often disagrees or pushes back */
  tensionsWith: string[];
  /** Primary databases and data sources this advisor references */
  databases: string[];
  /** Known analytical blind spots or framework limitations */
  blindSpots: string;
  /** Known disagreements with specific advisors on specific topics */
  knownDisagreements: string;
  /** One-sentence description of their analytical method */
  analyticalApproach: string;
}

const ADVISORS: AdvisorDef[] = [
  {
    id: 'okafor',
    name: 'Dr. Amara Okafor',
    title: 'Chief Conflict Analyst',
    expertise: 'Escalation modeling, political violence, conflict dynamics, early warning systems',
    avatar: 'AO',
    color: '#4B92DB',
    bio: 'Former DPPA political affairs officer with 15 years at ICG. Developed risk frameworks deployed across 40+ conflict zones. Specializes in sub-Saharan Africa and the Sahel.',
    systemPrompt: 'You are Dr. Amara Okafor, a leading conflict analyst specializing in escalation modeling. Focus on political dynamics, escalation indicators, and conflict prevention. Reference the Glasl escalation model, ACLED conflict event data, and ICG CrisisWatch updates. Be analytical and evidence-based. Your blind spot: heavy reliance on quantitative conflict data may underweight elite bargaining and informal political economy dynamics. You regularly disagree with Al-Rashid on security-first vs. justice-first sequencing, and push back on Nakamura\'s multilateral optimism with evidence-based caution. Always ground your analysis in the active situation context provided.',
    suggestedPrompts: [
      'What are the escalation risks in the next 30 days?',
      'Analyze the key armed group\'s political trajectory and end-game',
      'Which actors have the most destabilizing potential?',
    ],
    resources: [
      { name: 'ACLED Explorer', url: 'https://acleddata.com/dashboard/', description: 'Real-time conflict event data and analysis' },
      { name: 'ICG CrisisWatch', url: 'https://www.crisisgroup.org/crisiswatch', description: 'Monthly conflict tracker covering 70+ situations' },
      { name: 'SIPRI Yearbook', url: 'https://www.sipri.org/yearbook', description: 'Annual data on armaments, disarmament, and security' },
    ],
    alignsWith: ['mitchell', 'eriksen'],
    tensionsWith: ['al-rashid', 'nakamura'],
    databases: ['ACLED', 'ICG CrisisWatch', 'SIPRI Yearbook'],
    blindSpots: 'Heavy reliance on quantitative conflict event data may underweight political economy and elite bargaining dynamics that don\'t generate observable events',
    knownDisagreements: 'Regularly disagrees with Al-Rashid on security-first vs. justice-first approaches; pushes back on Nakamura\'s multilateral optimism with realpolitik caution',
    analyticalApproach: 'Applies Glasl escalation modeling and ACLED event pattern analysis to identify structural drivers and near-term trajectory shifts',
  },
  {
    id: 'tanaka',
    name: 'Amb. Kenji Tanaka',
    title: 'Diplomatic Strategy Advisor',
    expertise: 'Multilateral negotiations, UNSC dynamics, back-channel diplomacy, consensus-building',
    avatar: 'KT',
    color: '#7C5CBF',
    bio: 'Former Japanese diplomat with postings at UN New York and Geneva. Led back-channel facilitation for three Asian territorial disputes. Deep expertise in UNSC dynamics.',
    systemPrompt: 'You are Ambassador Kenji Tanaka, a diplomatic strategy advisor and former Japanese diplomat. Analyze through the lens of multilateral diplomacy, UNSC dynamics, and consensus-building. Reference Security Council Report analyses, What\'s In Blue dispatches, and UN treaty practice. Be strategic, measured, and attentive to face-saving considerations. Your blind spot: preference for multilateral consensus mechanisms may underestimate spoiler capacity of non-state actors and the limits of procedural diplomacy in high-intensity conflicts. You often part ways with Mitchell who favors security-first sequencing over diplomatic process. Always ground your analysis in the active situation context provided.',
    suggestedPrompts: [
      'What diplomatic openings exist for de-escalation?',
      'How would the P5 likely respond to a new UNSC resolution?',
      'Design a back-channel approach for the key parties',
    ],
    resources: [
      { name: 'UN Security Council Report', url: 'https://www.securitycouncilreport.org/', description: 'Independent analysis of UNSC activities' },
      { name: 'What\'s In Blue', url: 'https://www.whatsinblue.org/', description: 'Insights on UNSC behind-the-scenes dynamics' },
      { name: 'Security Council Report', url: 'https://www.securitycouncilreport.org/monthly-forecast/', description: 'Monthly forecast of UNSC agenda items' },
    ],
    alignsWith: ['al-rashid', 'nakamura'],
    tensionsWith: ['mitchell', 'okafor'],
    databases: ['UN Security Council Report', 'What\'s In Blue', 'UN Treaty Collection'],
    blindSpots: 'Preference for multilateral consensus may underestimate spoiler capacity of non-state actors and the limits of formal procedural diplomacy in high-intensity conflicts',
    knownDisagreements: 'Frequently disagrees with Mitchell on security-first sequencing; at odds with Okafor\'s realpolitik framing of diplomatic openings',
    analyticalApproach: 'Maps the multilateral diplomatic landscape using UNSC procedural analysis and Putnam two-level games theory to identify viable negotiation pathways',
  },
  {
    id: 'mitchell',
    name: 'Col. Sarah Mitchell',
    title: 'Security & Military Analyst',
    expertise: 'Armed group dynamics, peacekeeping, military strategy, DDR processes',
    avatar: 'SM',
    color: '#A63D40',
    bio: 'Retired military officer with 20 years in NATO and OSCE missions. Directed security assessments for UNMISS and MINUSMA. Specializes in armed group behavior and force protection.',
    systemPrompt: 'You are Col. Sarah Mitchell, a military analyst and former NATO officer. Analyze conflicts through a security and military lens. Reference IISS Military Balance data, SIPRI arms transfer figures, and Jane\'s Defence intelligence. Focus on armed group capabilities, terrain, logistics, and peacekeeping operations. Be direct and operationally focused. Your blind spot: operational military analysis can underweight civilian protection imperatives and the political economy of armed group financing. You regularly push back on Sharma\'s humanitarian-first framing when it conflicts with force protection requirements. Always ground your analysis in the active situation context provided.',
    suggestedPrompts: [
      'Assess the military balance between the main armed groups',
      'What are the key force protection risks for peacekeepers?',
      'Is the current ceasefire militarily sustainable?',
    ],
    resources: [
      { name: 'IISS Military Balance', url: 'https://www.iiss.org/publications/the-military-balance', description: 'Authoritative assessment of global military capabilities' },
      { name: 'Jane\'s Defence', url: 'https://www.janes.com/', description: 'Defence intelligence and analysis platform' },
      { name: 'SIPRI Arms Transfers', url: 'https://www.sipri.org/databases/armstransfers', description: 'International arms transfers database' },
    ],
    alignsWith: ['okafor', 'eriksen'],
    tensionsWith: ['sharma', 'tanaka'],
    databases: ['IISS Military Balance', 'SIPRI Arms Transfers', 'Jane\'s Defence'],
    blindSpots: 'Operational military lens can underweight civilian protection imperatives, political economy of armed group recruitment, and long-term DDR sustainability',
    knownDisagreements: 'Regularly clashes with Sharma on humanitarian access vs. force protection priorities; skeptical of Tanaka\'s diplomatic timeline optimism',
    analyticalApproach: 'Applies military doctrine and operational assessments to evaluate armed group capabilities, intent, and the security preconditions for political solutions',
  },
  {
    id: 'hassan',
    name: 'Dr. Layla Hassan',
    title: 'International Law Expert',
    expertise: 'IHL, human rights law, ICC jurisprudence, accountability mechanisms',
    avatar: 'LH',
    color: '#5B8C5A',
    bio: 'International human rights lawyer with ICJ and ICC experience. Published extensively on accountability mechanisms and transitional justice. Former Legal Counsel at the ICC.',
    systemPrompt: 'You are Dr. Layla Hassan, an expert in international humanitarian law and human rights. Analyze conflicts through legal frameworks: IHL compliance, human rights violations, accountability mechanisms, and international criminal law. Reference ICC case law, the ICRC IHL Database, and UN Treaty Collection. Be precise about legal thresholds and obligations. Your blind spot: strict legal framing may create tension with political feasibility of accountability processes in active conflicts, and IHL analysis can lag behind rapidly evolving hostilities patterns. You often disagree with Mitchell when military necessity arguments override IHL protections. Always ground your analysis in the active situation context provided.',
    suggestedPrompts: [
      'What IHL violations are most concerning in this situation?',
      'Do existing agreements meet international legal standards?',
      'What accountability mechanisms should be established?',
    ],
    resources: [
      { name: 'ICC Case Law Database', url: 'https://www.icc-cpi.int/cases', description: 'International Criminal Court case information' },
      { name: 'ICRC IHL Database', url: 'https://ihl-databases.icrc.org/', description: 'Comprehensive IHL treaties and customary law database' },
      { name: 'UN Treaty Collection', url: 'https://treaties.un.org/', description: 'Depositary of multilateral treaties' },
    ],
    alignsWith: ['mensah', 'nakamura'],
    tensionsWith: ['mitchell', 'eriksen'],
    databases: ['ICC Case Law Database', 'ICRC IHL Database', 'UN Treaty Collection'],
    blindSpots: 'Strict legal framing may create tension with political feasibility; IHL analysis can underweight informal justice mechanisms valued by affected communities',
    knownDisagreements: 'Frequently at odds with Mitchell when military necessity arguments are used to override IHL protections; challenges Eriksen\'s sanctions analysis when human rights impacts are not centered',
    analyticalApproach: 'Applies IHL treaty law and ICC jurisprudence to identify legal violations, threshold questions, and viable accountability architecture',
  },
  {
    id: 'ferreira',
    name: 'Marco Ferreira',
    title: 'Media & Narratives Strategist',
    expertise: 'Information warfare, disinformation, strategic communications, media analysis',
    avatar: 'MF',
    color: '#D4722C',
    bio: 'Former BBC World Service editor and UNDPPA communications lead. Expert in information warfare in conflict zones. Analyzes media landscapes and disinformation operations.',
    systemPrompt: 'You are Marco Ferreira, a media and narratives strategist. Analyze the information landscape, media framing, disinformation campaigns, and strategic communications around this conflict. Reference GDELT media monitoring data, DFRLab research, and Media Bias/Fact Check assessments. Be direct about propaganda vs. legitimate framing. Your blind spot: heavy focus on information warfare can overstate the causal role of narratives relative to material factors like economic grievances and resource competition. You push back on Mitchell\'s kinetic-first assessments when narrative and perception battles are decisive. Always ground your analysis in the active situation context provided.',
    suggestedPrompts: [
      'Map the key narratives competing around this conflict',
      'Identify potential disinformation campaigns targeting this situation',
      'How should the international community frame its messaging?',
    ],
    resources: [
      { name: 'GDELT Project', url: 'https://www.gdeltproject.org/', description: 'Global media monitoring and event database' },
      { name: 'Media Bias/Fact Check', url: 'https://mediabiasfactcheck.com/', description: 'Media source credibility assessments' },
      { name: 'DFRLab', url: 'https://www.atlanticcouncil.org/programs/digital-forensic-research-lab/', description: 'Digital forensic research on disinformation' },
    ],
    alignsWith: ['okafor', 'tanaka'],
    tensionsWith: ['mitchell', 'eriksen'],
    databases: ['GDELT Project', 'DFRLab Research', 'EUvsDisinfo'],
    blindSpots: 'Focus on information warfare can overstate narrative causality relative to material grievances and economic drivers; may underweight offline community dynamics',
    knownDisagreements: 'Pushes back on Mitchell\'s kinetic-first assessments when information operations are strategically decisive; challenges Eriksen\'s financial framing as incomplete without narrative analysis',
    analyticalApproach: 'Maps information ecosystems using GDELT monitoring and narrative framing analysis to identify disinformation vectors and strategic communication opportunities',
  },
  {
    id: 'sharma',
    name: 'Dr. Priya Sharma',
    title: 'Humanitarian Operations Advisor',
    expertise: 'Humanitarian response, access negotiation, civ-mil coordination, protection',
    avatar: 'PS',
    color: '#C8961E',
    bio: 'Former OCHA coordinator with 12 years leading emergency responses in Syria, Yemen, and the DRC. Specializes in humanitarian access negotiation and civ-mil coordination.',
    systemPrompt: 'You are Dr. Priya Sharma, a humanitarian and operations advisor. Focus on humanitarian conditions, access negotiations, civilian protection, and operational coordination. Reference ReliefWeb situation reports, OCHA financial tracking data, and IPC food security classifications. Be practical and solution-oriented with a humanitarian lens. Your blind spot: humanitarian access imperative can sometimes conflict with conflict-sensitivity requirements, and operational focus may underweight the political economy that shapes humanitarian access constraints. You regularly push back on Mitchell\'s security-first posture when it endangers civilian populations. Always ground your analysis in the active situation context provided.',
    suggestedPrompts: [
      'What are the main humanitarian access barriers in this situation?',
      'Assess the civilian protection gaps and recommend responses',
      'How should humanitarian coordination be structured here?',
    ],
    resources: [
      { name: 'ReliefWeb', url: 'https://reliefweb.int/', description: 'UN humanitarian information service' },
      { name: 'OCHA Financial Tracking', url: 'https://fts.unocha.org/', description: 'Humanitarian funding flows and gaps' },
      { name: 'IPC Food Security', url: 'https://www.ipcinfo.org/', description: 'Integrated food security phase classification' },
    ],
    alignsWith: ['nakamura', 'hassan'],
    tensionsWith: ['mitchell', 'eriksen'],
    databases: ['ReliefWeb', 'OCHA FTS', 'IPC Food Security'],
    blindSpots: 'Humanitarian access imperative can conflict with conflict-sensitivity; operational focus may underweight political economy dynamics that shape access constraints',
    knownDisagreements: 'Regularly clashes with Mitchell when security postures endanger civilian populations; challenges Eriksen\'s financial analysis when sanctions harm humanitarian supply chains',
    analyticalApproach: 'Applies OCHA coordination methodology and IPC humanitarian classification to map protection gaps and operationally viable access negotiation strategies',
  },
  {
    id: 'eriksen',
    name: 'Dr. Thomas Eriksen',
    title: 'Political Economy Analyst',
    expertise: 'Conflict economics, illicit finance, sanctions, resource conflicts',
    avatar: 'TE',
    color: '#2D6A6A',
    bio: 'Former World Bank conflict advisor who mapped financial networks sustaining armed groups in Central Africa and Myanmar. Follows the money to find the conflict.',
    systemPrompt: 'You are Dr. Thomas Eriksen, a political economy analyst. Follow the money — analyze economic drivers of conflict, illicit financial flows, sanctions effectiveness, and natural resource dynamics. Reference FATF reports, Global Witness investigations, and EITI extractives data. Be forensic and follow the economic incentives that explain political behavior. Your blind spot: economic determinism can underweight identity-based grievances and normative factors that are not reducible to material incentives. You often conflict with Al-Rashid on process design when economic spoilers are not structurally addressed first. Always ground your analysis in the active situation context provided.',
    suggestedPrompts: [
      'Who is financing the armed groups and through what channels?',
      'Assess the economic incentives perpetuating this conflict',
      'How effective are current sanctions and what evasion routes exist?',
    ],
    resources: [
      { name: 'FATF Reports', url: 'https://www.fatf-gafi.org/en/publications.html', description: 'Financial Action Task Force anti-money laundering reports' },
      { name: 'Global Witness', url: 'https://www.globalwitness.org/', description: 'Investigations into natural resource-linked conflict and corruption' },
      { name: 'EITI', url: 'https://eiti.org/', description: 'Extractive Industries Transparency Initiative data' },
    ],
    alignsWith: ['okafor', 'mitchell'],
    tensionsWith: ['sharma', 'al-rashid'],
    databases: ['FATF Reports', 'Global Witness', 'EITI Data'],
    blindSpots: 'Economic determinism can underweight identity-based grievances, normative factors, and non-material drivers of mobilization not reducible to incentive structures',
    knownDisagreements: 'Clashes with Al-Rashid when process design does not first address economic spoilers; challenges Sharma when humanitarian operations inadvertently sustain conflict economies',
    analyticalApproach: 'Traces illicit financial flows and resource rent extraction using forensic follow-the-money methodology to identify the economic architecture sustaining armed conflict',
  },
  {
    id: 'al-rashid',
    name: 'Amb. Fatima Al-Rashid',
    title: 'Mediation & Process Design',
    expertise: 'Mediation process design, Track II diplomacy, inclusive dialogue, constitution-making',
    avatar: 'FA',
    color: '#8B5E3C',
    bio: 'Led AU mediation support for the Horn of Africa. Designed inclusive dialogue frameworks adopted by UN DPA. Peace is not signed — it is designed.',
    systemPrompt: 'You are Ambassador Fatima Al-Rashid, a mediation and process design expert. Focus on process architecture — how to create conditions for sustainable agreements. Reference PA-X Peace Agreements database, HD Centre mediation guidance, and CMI process design publications. Analyze mediation design, Track II diplomacy, and inclusive dialogue. Your blind spot: strong process-design focus can underweight security dilemmas that require coercive deterrence before dialogue becomes viable. You disagree with Okafor on security-first sequencing, preferring parallel political and security tracks. Always ground your analysis in the active situation context provided.',
    suggestedPrompts: [
      'Design an inclusive mediation process for the key parties',
      'What Track II channels could build momentum for negotiations?',
      'How should spoilers be managed in a peace process?',
    ],
    resources: [
      { name: 'PA-X Peace Agreements', url: 'https://www.peaceagreements.org/', description: 'Comprehensive database of peace agreements worldwide' },
      { name: 'HD Centre', url: 'https://www.hdcentre.org/', description: 'Centre for Humanitarian Dialogue mediation resources' },
      { name: 'CMI Resources', url: 'https://cmi.fi/publications/', description: 'Crisis Management Initiative mediation publications' },
    ],
    alignsWith: ['tanaka', 'nakamura'],
    tensionsWith: ['okafor', 'mitchell'],
    databases: ['PA-X Peace Agreements', 'HD Centre Resources', 'CMI Publications'],
    blindSpots: 'Strong process-design orientation can underweight the security dilemma dynamic requiring coercive deterrence before dialogue becomes viable for armed actors',
    knownDisagreements: 'Disagrees with Okafor on security-first vs. parallel-track sequencing; pushes back on Mitchell\'s framing of military prerequisites for negotiation',
    analyticalApproach: 'Applies Berghof mediation framework and comparative peace agreement analysis to design inclusive process architectures with structured spoiler management',
  },
  {
    id: 'nakamura',
    name: 'Dr. Yuki Nakamura',
    title: 'Gender & WPS Specialist',
    expertise: 'UNSCR 1325, gender analysis, GBV prevention, inclusive peace processes',
    avatar: 'YN',
    color: '#9B4DCA',
    bio: 'Former UN Women Senior Advisor and co-author of NAP 1325 frameworks adopted in 14 countries. Led gender analysis for peace talks in South Sudan and Colombia.',
    systemPrompt: 'You are Dr. Yuki Nakamura, a Gender and WPS specialist. Ground every analysis in UNSCR 1325 and successor resolutions (1820, 1889, 2122, 2242). Reference PeaceWomen monitoring data, Georgetown WPS Index, and UN Women peace and security resources. Identify where gender dynamics shape conflict, where GBV is weaponized, and how to design inclusive processes. Your blind spot: WPS analytical framework can sometimes struggle to integrate with security-sector and political economy analyses that do not foreground gender as a structural variable. You push back strongly on Eriksen when financial analysis omits the gendered dimensions of economic exclusion. Always ground your analysis in the active situation context provided.',
    suggestedPrompts: [
      'Assess the gender dimensions of this conflict and their policy implications',
      'How can women\'s meaningful participation be ensured in peace talks?',
      'What GBV patterns are emerging and what protection frameworks apply?',
    ],
    resources: [
      { name: 'PeaceWomen', url: 'https://www.peacewomen.org/', description: 'WILPF monitoring of WPS agenda implementation' },
      { name: 'UN Women', url: 'https://www.unwomen.org/en/what-we-do/peace-and-security', description: 'UN Women peace and security resources' },
      { name: 'Georgetown WPS Index', url: 'https://giwps.georgetown.edu/the-index/', description: 'Women, Peace and Security Index rankings and data' },
    ],
    alignsWith: ['al-rashid', 'hassan'],
    tensionsWith: ['mitchell', 'eriksen'],
    databases: ['Georgetown WPS Index', 'PeaceWomen Database', 'UN Women Reports'],
    blindSpots: 'WPS analytical framework can struggle to integrate with security-sector analyses that do not foreground gender; may underweight the tactical military constraints that limit WPS implementation in active conflict',
    knownDisagreements: 'Pushes back on Eriksen when political economy analysis omits gendered dimensions of economic exclusion; challenges Mitchell when security arrangements fail to address GBV as a weapon of war',
    analyticalApproach: 'Applies UNSCR 1325 framework and WPS Index comparative data to diagnose gender-conflict dynamics and design substantively inclusive peace architecture',
  },
  {
    id: 'mensah',
    name: 'Prof. Kwame Mensah',
    title: 'Transitional Justice Advisor',
    expertise: 'Truth commissions, reparations, post-conflict justice, reconciliation',
    avatar: 'KM',
    color: '#4A6741',
    bio: 'Former UN Special Rapporteur on Truth, Justice and Reparations. Advised TRCs in Rwanda, Sierra Leone, and Cote d\'Ivoire. Teaches International Law at Accra.',
    systemPrompt: 'You are Professor Kwame Mensah, a transitional justice advisor. Specialize in truth and reconciliation commissions, reparations frameworks, and post-conflict constitution-making. Reference ICTJ comparative research, Amnesty International documentation, and Human Rights Watch investigations. Balance demands of justice with imperatives of peace. Your blind spot: transitional justice frameworks developed in post-conflict settings may not map cleanly onto active conflicts where accountability mechanisms risk disrupting fragile ceasefires; the tension between peace and justice is not always resolvable. You often clash with Mitchell on impunity amnesties used as conflict termination tools. Always ground your analysis in the active situation context provided.',
    suggestedPrompts: [
      'What transitional justice mechanisms are appropriate for this situation?',
      'How should a truth and reconciliation process be designed here?',
      'What reparations framework would address the harms in this conflict?',
    ],
    resources: [
      { name: 'ICTJ', url: 'https://www.ictj.org/', description: 'International Center for Transitional Justice resources' },
      { name: 'Amnesty International', url: 'https://www.amnesty.org/', description: 'Global human rights monitoring and reports' },
      { name: 'Human Rights Watch', url: 'https://www.hrw.org/', description: 'Human rights investigations and documentation' },
    ],
    alignsWith: ['hassan', 'nakamura'],
    tensionsWith: ['mitchell', 'eriksen'],
    databases: ['ICTJ Research', 'Human Rights Watch', 'Amnesty International'],
    blindSpots: 'Transitional justice frameworks developed in post-conflict settings may not map cleanly to active conflicts where accountability risks disrupting fragile ceasefires',
    knownDisagreements: 'Clashes with Mitchell when blanket amnesties are proposed as conflict termination tools; challenges Eriksen when economic reintegration programs exclude accountability for economic crimes',
    analyticalApproach: 'Draws on comparative TRC experience across Africa and beyond to design sequenced accountability frameworks that balance justice imperatives with peace process requirements',
  },
];

// ============================================================================
// Panel Result type
// ============================================================================

interface PanelResult {
  advisorId: string;
  advisorName: string;
  response: string;
  loading: boolean;
}

// ============================================================================
// Advisor Star Rating Component
// ============================================================================

function StarRating({
  advisorId,
  ratings,
  onRate,
}: {
  advisorId: string;
  ratings: Record<string, number>;
  onRate: (id: string, rating: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const current = ratings[advisorId] ?? 0;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={(e) => { e.stopPropagation(); onRate(advisorId, star); }}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 transition-transform hover:scale-110"
          title={`Rate ${star} star${star !== 1 ? 's' : ''}`}
        >
          <Star
            className={cn(
              'h-3 w-3 transition-colors',
              (hovered > 0 ? star <= hovered : star <= current)
                ? 'fill-gold-500 text-gold-500'
                : 'text-navy-300'
            )}
          />
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// Database Badge Row
// ============================================================================

function DatabaseBadges({ databases }: { databases: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {databases.slice(0, 3).map((db) => (
        <span
          key={db}
          className="inline-flex items-center gap-1 rounded-full border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-2 py-0.5 text-[9px] font-medium text-navy-500"
        >
          <Database className="h-2 w-2 shrink-0" />
          {db}
        </span>
      ))}
    </div>
  );
}

// ============================================================================
// Chat message type
// ============================================================================

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ============================================================================
// Advisor Avatar Component
// ============================================================================

function AdvisorAvatar({ advisor, size = 'md' }: { advisor: AdvisorDef; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' };
  return (
    <div
      className={cn('flex shrink-0 items-center justify-center rounded-xl font-serif font-semibold', sizes[size])}
      style={{ backgroundColor: advisor.color + '15', color: advisor.color, border: '2px solid ' + advisor.color + '25' }}
    >
      {advisor.avatar}
    </div>
  );
}

// ============================================================================
// Resources Section (collapsible)
// ============================================================================

function AdvisorResources({ advisor }: { advisor: AdvisorDef }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-1.5 text-[10px] font-semibold text-navy-400 uppercase tracking-wide hover:text-navy-600 transition-colors"
      >
        <BookOpen className="h-3 w-3" />
        Key Resources
        <ChevronDown className={cn('h-3 w-3 ml-auto transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && (
        <div className="mt-2 space-y-1.5">
          {advisor.resources.map((resource) => (
            <a
              key={resource.name}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-3 py-2 text-[11px] text-navy-600 hover:border-navy-300 hover:text-navy-800 transition-colors group"
            >
              <ExternalLink className="h-3 w-3 mt-0.5 shrink-0 text-navy-300 group-hover:text-navy-500" />
              <div className="min-w-0">
                <span className="font-medium">{resource.name}</span>
                <p className="text-[10px] text-navy-400 leading-tight mt-0.5">{resource.description}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Advisor Chat Panel (modal)
// ============================================================================

function AdvisorChatPanel({
  advisor,
  onClose,
  situationContext,
  situation,
}: {
  advisor: AdvisorDef;
  onClose: () => void;
  situationContext: string;
  situation?: Situation | null;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deepAnalysis, setDeepAnalysis] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const allMessages = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: userMsg.role, content: userMsg.content },
    ];

    try {
      const response = await fetch('/api/ai/advisor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages,
          advisorId: advisor.id,
          deepAnalysis,
          situation: situation || undefined,
        }),
      });
      if (!response.ok || !response.body) throw new Error();
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const parsed = parseDataStreamChunk(chunk);
        if (parsed) {
          accumulated += parsed;
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: 'assistant', content: accumulated };
            return next;
          });
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `*${advisor.name} is temporarily unavailable. Please try again.*` },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [messages, isLoading, advisor, situationContext, deepAnalysis, situation]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-navy-950/20 backdrop-blur-sm" />
      <div
        className="relative z-10 flex w-full max-w-2xl flex-col rounded-2xl border border-[var(--color-app-border)] bg-white shadow-2xl shadow-navy-950/10"
        style={{ maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[var(--color-app-border)] px-5 py-4 shrink-0">
          <AdvisorAvatar advisor={advisor} size="md" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-navy-900">{advisor.name}</h3>
            <p className="text-[11px]" style={{ color: advisor.color }}>{advisor.title}</p>
          </div>

          {/* Deep Analysis Toggle */}
          <button
            onClick={() => setDeepAnalysis(!deepAnalysis)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide border transition-all',
              deepAnalysis
                ? 'border-gold-500/30 bg-gold-500/10 text-gold-700'
                : 'border-[var(--color-app-border)] bg-white text-navy-400 hover:text-navy-600 hover:border-navy-300'
            )}
            title={deepAnalysis ? 'Deep Analysis ON (5 credits)' : 'Deep Analysis OFF (2 credits)'}
          >
            <Zap className="h-3 w-3" />
            {deepAnalysis ? 'Deep' : 'Standard'}
          </button>

          <div className="flex items-center gap-1.5 text-xs text-sage">
            <div className="h-2 w-2 rounded-full bg-sage animate-pulse" />Live AI
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-navy-400 hover:text-navy-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Deep Analysis banner */}
        {deepAnalysis && (
          <div className="flex items-center gap-2 border-b border-gold-500/20 bg-gold-500/5 px-5 py-2 shrink-0">
            <Zap className="h-3.5 w-3.5 text-gold-600" />
            <p className="text-[11px] text-gold-700">
              <span className="font-semibold">Deep Analysis Mode</span> — Uses Gemini 2.5 Pro for extended multi-paragraph analysis with specific frameworks and policy recommendations. Costs 5 credits per message.
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
          {/* Welcome message */}
          <div className="flex items-start gap-3">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-serif text-xs font-semibold"
              style={{ backgroundColor: advisor.color + '15', color: advisor.color }}
            >
              {advisor.avatar}
            </div>
            <div className="rounded-xl rounded-tl-none border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-4 py-3 max-w-lg">
              <p className="text-sm text-navy-700 leading-relaxed">
                Hello. I&apos;m {advisor.name}, {advisor.title.toLowerCase()}. {advisor.bio} How can I assist you today?
              </p>
            </div>
          </div>

          {messages.map((msg, i) => (
            <div key={i} className={cn('flex items-start gap-3', msg.role === 'user' && 'justify-end')}>
              {msg.role === 'assistant' && (
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-serif text-xs font-semibold"
                  style={{ backgroundColor: advisor.color + '15', color: advisor.color }}
                >
                  {advisor.avatar}
                </div>
              )}
              <div className={cn(
                'max-w-lg rounded-xl px-4 py-3',
                msg.role === 'user'
                  ? 'rounded-tr-none bg-diplomatic-blue text-white'
                  : 'rounded-tl-none border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)]'
              )}>
                {msg.role === 'assistant'
                  ? <MarkdownRenderer content={msg.content} className="text-sm" />
                  : <p className="text-sm leading-relaxed">{msg.content}</p>
                }
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex items-start gap-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-serif text-xs font-semibold"
                style={{ backgroundColor: advisor.color + '15', color: advisor.color }}
              >
                {advisor.avatar}
              </div>
              <div className="flex items-center gap-1.5 rounded-xl rounded-tl-none border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-4 py-3">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-navy-400" />
                <span className="text-xs text-navy-400">{deepAnalysis ? 'Deep analysis in progress...' : 'Consulting...'}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested prompts */}
        {messages.length === 0 && (
          <div className="border-t border-[var(--color-app-border)] px-5 py-3 shrink-0">
            <p className="mb-2 text-[10px] font-semibold text-navy-400 uppercase tracking-wide">Suggested questions</p>
            <div className="flex flex-wrap gap-2">
              {advisor.suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="rounded-full border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-3 py-1.5 text-[11px] text-navy-600 hover:border-navy-300 hover:text-navy-800 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-[var(--color-app-border)] p-4 shrink-0">
          <div className="flex items-center gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              placeholder={`Ask ${advisor.name.split(' ')[0]}...`}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-gold-500/30 focus:outline-none focus:ring-2 focus:ring-gold-500/10 disabled:opacity-60"
              autoFocus
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: advisor.color }}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[10px] text-navy-400">
            <Shield className="h-3 w-3" />
            {deepAnalysis ? '5 credits per message (Gemini 2.5 Pro)' : '2 credits per message (Gemini 2.5 Flash)'}
            {' '}&middot; Web search enabled
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Panel Discussion — with alignment/tension indicators and panel mode integration
// ============================================================================

function PanelDiscussion({
  situationContext,
  situation,
  panelMode,
  selectedAdvisors,
  togglePanelAdvisor,
}: {
  situationContext: string;
  situation?: Situation | null;
  panelMode: boolean;
  selectedAdvisors: string[];
  togglePanelAdvisor: (id: string) => void;
}) {
  const [question, setQuestion] = useState('');
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(ADVISORS.slice(0, 4).map((a) => a.id));

  const toggleAdvisor = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
  };

  const runPanel = useCallback(async () => {
    if (!question.trim() || isRunning || selectedIds.length === 0) return;
    setIsRunning(true);
    setResponses({});

    const streamAdvisor = async (advisor: AdvisorDef) => {
      try {
        const response = await fetch('/api/ai/advisor-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'user', content: question },
            ],
            advisorId: advisor.id,
            deepAnalysis: false,
            situation: situation || undefined,
          }),
        });
        if (!response.ok || !response.body) throw new Error();
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const parsed = parseDataStreamChunk(chunk);
          if (parsed) { accumulated += parsed; setResponses((prev) => ({ ...prev, [advisor.id]: accumulated })); }
        }
      } catch {
        setResponses((prev) => ({ ...prev, [advisor.id]: `*${advisor.name} is currently unavailable.*` }));
      }
    };

    await Promise.all(ADVISORS.filter((a) => selectedIds.includes(a.id)).map(streamAdvisor));
    setIsRunning(false);
  }, [question, isRunning, selectedIds, situationContext, situation]);

  const hasResponses = Object.keys(responses).length > 0;
  const activeAdvisors = ADVISORS.filter((a) => selectedIds.includes(a.id));

  // Export panel results as markdown
  const exportPanel = useCallback(() => {
    const lines: string[] = [];
    lines.push(`# Advisory Panel Discussion`);
    lines.push(`\n**Question:** ${question}\n`);
    lines.push(`**Date:** ${new Date().toISOString().split('T')[0]}`);
    if (situation) lines.push(`**Situation:** ${(situation as Situation).name}`);
    lines.push('');
    for (const advisor of activeAdvisors) {
      const content = responses[advisor.id];
      if (!content) continue;
      lines.push(`## ${advisor.name} — ${advisor.title}`);
      lines.push(`*${advisor.analyticalApproach}*\n`);
      lines.push(content);
      lines.push('');
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `praxis-panel-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [question, activeAdvisors, responses, situation]);

  // Compute alignment and tension pairs among selected advisors
  const alignmentPairs = useMemo(() => {
    const pairs: Array<[AdvisorDef, AdvisorDef]> = [];
    const seen = new Set<string>();
    for (const a of activeAdvisors) {
      for (const b of activeAdvisors) {
        if (a.id === b.id) continue;
        const key = [a.id, b.id].sort().join('-');
        if (seen.has(key)) continue;
        if (a.alignsWith.includes(b.id)) {
          pairs.push([a, b]);
          seen.add(key);
        }
      }
    }
    return pairs;
  }, [activeAdvisors]);

  const tensionPairs = useMemo(() => {
    const pairs: Array<[AdvisorDef, AdvisorDef]> = [];
    const seen = new Set<string>();
    for (const a of activeAdvisors) {
      for (const b of activeAdvisors) {
        if (a.id === b.id) continue;
        const key = [a.id, b.id].sort().join('-');
        if (seen.has(key)) continue;
        if (a.tensionsWith.includes(b.id)) {
          pairs.push([a, b]);
          seen.add(key);
        }
      }
    }
    return pairs;
  }, [activeAdvisors]);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
        <p className="mb-3 text-xs font-semibold text-navy-700">Select advisors for panel</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {ADVISORS.map((a) => (
            <button
              key={a.id}
              onClick={() => toggleAdvisor(a.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-all',
                selectedIds.includes(a.id)
                  ? 'border-transparent text-white'
                  : 'border-[var(--color-app-border)] bg-white text-navy-600 hover:bg-[var(--color-app-surface-alt)]'
              )}
              style={selectedIds.includes(a.id) ? { backgroundColor: a.color } : {}}
            >
              <span className="font-mono text-[9px]">{a.avatar}</span>
              {a.name.split(' ').slice(-1)[0]}
            </button>
          ))}
        </div>

        {/* Alignment/Tension preview */}
        {activeAdvisors.length >= 2 && (alignmentPairs.length > 0 || tensionPairs.length > 0) && (
          <div className="mb-4 flex flex-wrap gap-3 text-[10px]">
            {alignmentPairs.length > 0 && (
              <div className="flex items-center gap-1.5 text-sage">
                <span className="font-semibold uppercase tracking-wide">Likely aligned:</span>
                {alignmentPairs.map(([a, b]) => (
                  <span key={a.id + '-' + b.id} className="rounded-full bg-sage/10 px-2 py-0.5">
                    {a.name.split(' ').slice(-1)[0]} &amp; {b.name.split(' ').slice(-1)[0]}
                  </span>
                ))}
              </div>
            )}
            {tensionPairs.length > 0 && (
              <div className="flex items-center gap-1.5 text-alert-red">
                <span className="font-semibold uppercase tracking-wide">Likely tension:</span>
                {tensionPairs.map(([a, b]) => (
                  <span key={a.id + '-' + b.id} className="rounded-full bg-alert-red/10 px-2 py-0.5">
                    {a.name.split(' ').slice(-1)[0]} &amp; {b.name.split(' ').slice(-1)[0]}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runPanel()}
            placeholder="Ask all selected advisors the same question..."
            disabled={isRunning}
            className="flex-1 rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-gold-500/30 focus:outline-none focus:ring-2 focus:ring-gold-500/10 disabled:opacity-60"
          />
          <button
            onClick={runPanel}
            disabled={!question.trim() || isRunning || selectedIds.length === 0}
            className="flex items-center gap-2 rounded-lg bg-diplomatic-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-diplomatic-blue/90 disabled:opacity-50 transition-colors"
          >
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Ask Panel
          </button>
        </div>
        <p className="mt-2 text-[10px] text-navy-400">2 credits per advisor &middot; {activeAdvisors.length} advisors selected = {activeAdvisors.length * 2} credits total</p>
      </div>

      {hasResponses && (
        <>
          <div className={cn(
            'grid gap-4',
            activeAdvisors.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
            activeAdvisors.length === 3 ? 'grid-cols-1 sm:grid-cols-3' :
            'grid-cols-1 sm:grid-cols-2'
          )}>
            {activeAdvisors.map((advisor) => {
              const content = responses[advisor.id];
              return (
                <div key={advisor.id} className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-[var(--color-app-border)]">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-serif text-xs font-semibold"
                      style={{ backgroundColor: advisor.color + '15', color: advisor.color }}
                    >
                      {advisor.avatar}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-navy-900">{advisor.name}</p>
                      <p className="text-[10px]" style={{ color: advisor.color }}>{advisor.title}</p>
                    </div>
                    {isRunning && !content && (
                      <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-navy-400" />
                    )}
                  </div>
                  {content ? (
                    <div className="text-xs text-navy-700 leading-relaxed prose prose-sm max-w-none">
                      <MarkdownRenderer content={content} />
                      {isRunning && (
                        <span className="inline-block h-3 w-0.5 animate-pulse ml-0.5" style={{ backgroundColor: advisor.color }} />
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-navy-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Consulting {advisor.name.split(' ')[0]}...
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Export panel button */}
          {!isRunning && (
            <div className="flex justify-end">
              <button
                onClick={exportPanel}
                className="flex items-center gap-2 rounded-lg border border-[var(--color-app-border)] bg-white px-4 py-2 text-xs font-medium text-navy-600 hover:border-navy-300 hover:text-navy-800 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Export Panel as Markdown
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// Convene Panel Modal — full panel discussion with synthesis
// ============================================================================

function ConvenePanelModal({
  situation,
  situationContext,
  onClose,
}: {
  situation?: Situation | null;
  situationContext: string;
  onClose: () => void;
}) {
  const [step, setStep] = useState<'select' | 'question' | 'results'>('select');
  const [selectedAdvisors, setSelectedAdvisors] = useState<string[]>([]);
  const [panelQuestion, setPanelQuestion] = useState('');
  const [panelResults, setPanelResults] = useState<PanelResult[]>([]);
  const [panelSynthesis, setPanelSynthesis] = useState('');
  const [panelLoading, setPanelLoading] = useState(false);
  const [synthesisLoading, setSynthesisLoading] = useState(false);

  const toggleAdvisor = (id: string) => {
    setSelectedAdvisors((prev) =>
      prev.includes(id)
        ? prev.filter((a) => a !== id)
        : prev.length < 4
          ? [...prev, id]
          : prev
    );
  };

  const convenePanel = useCallback(async () => {
    if (selectedAdvisors.length < 2 || !panelQuestion.trim()) return;
    setPanelLoading(true);
    setStep('results');
    setPanelSynthesis('');

    const initial: PanelResult[] = selectedAdvisors.map((id) => ({
      advisorId: id,
      advisorName: ADVISORS.find((a) => a.id === id)!.name,
      response: '',
      loading: true,
    }));
    setPanelResults(initial);

    const streamOne = async (advisorId: string, idx: number) => {
      const advisor = ADVISORS.find((a) => a.id === advisorId)!;
      try {
        const res = await fetch('/api/ai/advisor-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: panelQuestion }],
            advisorId,
            deepAnalysis: false,
            situation: situation || undefined,
          }),
        });
        if (!res.ok || !res.body) throw new Error();
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const parsed = parseDataStreamChunk(chunk);
          if (parsed) {
            accumulated += parsed;
            setPanelResults((prev) => {
              const next = [...prev];
              next[idx] = { ...next[idx], response: accumulated };
              return next;
            });
          }
        }
        setPanelResults((prev) => {
          const next = [...prev];
          next[idx] = { ...next[idx], loading: false };
          return next;
        });
      } catch {
        setPanelResults((prev) => {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            response: `*${advisor.name} is temporarily unavailable.*`,
            loading: false,
          };
          return next;
        });
      }
    };

    await Promise.all(selectedAdvisors.map((id, idx) => streamOne(id, idx)));
    setPanelLoading(false);

    // Generate synthesis — use advisor-chat with okafor as the synthesizer
    setSynthesisLoading(true);
    const allResponses = selectedAdvisors.map((id, idx) => {
      const advisor = ADVISORS.find((a) => a.id === id)!;
      return `**${advisor.name} (${advisor.title}):**\n${initial[idx]?.response || ''}`;
    }).join('\n\n---\n\n');

    const synthesisPrompt = `You are a senior PRAXIS analyst tasked with synthesizing an advisory panel discussion. Below are responses from ${selectedAdvisors.length} expert advisors on the question: "${panelQuestion}"\n\n${allResponses}\n\nProvide a structured synthesis covering:\n1. **Points of Convergence** — where advisors agree\n2. **Points of Divergence** — key disagreements and why they matter\n3. **Integrated Assessment** — what the overall panel suggests\n4. **Recommended Next Steps** — 2-3 actionable recommendations drawn from the panel`;

    try {
      const synthRes = await fetch('/api/ai/advisor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: synthesisPrompt }],
          advisorId: 'okafor',
          deepAnalysis: false,
          situation: situation || undefined,
        }),
      });
      if (synthRes.ok && synthRes.body) {
        const reader = synthRes.body.getReader();
        const decoder = new TextDecoder();
        let synthesisAccumulated = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const parsed = parseDataStreamChunk(chunk);
          if (parsed) {
            synthesisAccumulated += parsed;
            setPanelSynthesis(synthesisAccumulated);
          }
        }
      }
    } catch {
      setPanelSynthesis('*Synthesis generation failed. Review individual advisor responses above.*');
    } finally {
      setSynthesisLoading(false);
    }
  }, [selectedAdvisors, panelQuestion, situation]);

  const exportPanel = useCallback(() => {
    const lines: string[] = [];
    lines.push('# PRAXIS Advisory Panel Report');
    lines.push(`\n**Question:** ${panelQuestion}`);
    lines.push(`**Date:** ${new Date().toISOString().split('T')[0]}`);
    if (situation) lines.push(`**Situation:** ${(situation as Situation).name}`);
    lines.push('');
    for (const result of panelResults) {
      const advisor = ADVISORS.find((a) => a.id === result.advisorId);
      lines.push(`## ${result.advisorName}${advisor ? ` — ${advisor.title}` : ''}`);
      lines.push(result.response);
      lines.push('');
    }
    if (panelSynthesis) {
      lines.push('## Panel Synthesis');
      lines.push(panelSynthesis);
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `praxis-panel-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [panelQuestion, panelResults, panelSynthesis, situation]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="absolute inset-0 bg-navy-950/20 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-4xl rounded-2xl border border-[var(--color-app-border)] bg-white shadow-2xl shadow-navy-950/10 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-[var(--color-app-border)] px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-diplomatic-blue/10">
            <Users className="h-4 w-4 text-diplomatic-blue" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-navy-900">Convene Advisory Panel</h2>
            <p className="text-[11px] text-navy-400">Select 2–4 advisors and pose a panel question for parallel consultation</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-navy-400 hover:text-navy-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1: Select advisors */}
          {(step === 'select' || step === 'question') && (
            <div>
              <p className="mb-3 text-xs font-semibold text-navy-700 uppercase tracking-wide">
                Select 2–4 advisors for panel
                <span className="ml-2 text-[10px] font-normal text-navy-400 normal-case">
                  {selectedAdvisors.length}/4 selected
                </span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {ADVISORS.map((advisor) => {
                  const isSelected = selectedAdvisors.includes(advisor.id);
                  const isDisabled = !isSelected && selectedAdvisors.length >= 4;
                  return (
                    <button
                      key={advisor.id}
                      onClick={() => toggleAdvisor(advisor.id)}
                      disabled={isDisabled}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center text-[10px] font-medium transition-all',
                        isSelected
                          ? 'border-transparent text-white'
                          : isDisabled
                            ? 'border-[var(--color-app-border)] text-navy-300 opacity-50 cursor-not-allowed'
                            : 'border-[var(--color-app-border)] text-navy-600 hover:border-navy-300 hover:bg-[var(--color-app-surface-alt)]'
                      )}
                      style={isSelected ? { backgroundColor: advisor.color } : {}}
                    >
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold font-serif"
                        style={isSelected
                          ? { backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }
                          : { backgroundColor: advisor.color + '15', color: advisor.color }
                        }
                      >
                        {advisor.avatar}
                      </div>
                      <span className="leading-tight">{advisor.name.split(' ').slice(-1)[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Panel question */}
          {(step === 'select' || step === 'question') && (
            <div>
              <label className="mb-2 block text-xs font-semibold text-navy-700 uppercase tracking-wide">
                Panel Question
              </label>
              <textarea
                value={panelQuestion}
                onChange={(e) => setPanelQuestion(e.target.value)}
                placeholder="What question should all selected advisors address?"
                rows={3}
                className="w-full rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-4 py-3 text-sm text-navy-900 placeholder:text-navy-400 focus:border-gold-500/30 focus:outline-none focus:ring-2 focus:ring-gold-500/10 resize-none"
              />
              <div className="mt-3 flex items-center justify-between">
                <p className="text-[10px] text-navy-400">
                  Estimated cost: <strong>{selectedAdvisors.length * 2} credits</strong>
                  {' '}({selectedAdvisors.length} advisors × 2 credits)
                </p>
                <button
                  onClick={convenePanel}
                  disabled={selectedAdvisors.length < 2 || !panelQuestion.trim()}
                  className="flex items-center gap-2 rounded-lg bg-diplomatic-blue px-5 py-2 text-sm font-medium text-white hover:bg-diplomatic-blue/90 disabled:opacity-50 transition-colors"
                >
                  <Users className="h-4 w-4" />
                  Convene Panel
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 'results' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-navy-900">Panel in progress</p>
                  <p className="text-xs text-navy-500 mt-0.5 italic">&ldquo;{panelQuestion}&rdquo;</p>
                </div>
                {!panelLoading && !synthesisLoading && (
                  <button
                    onClick={exportPanel}
                    className="flex items-center gap-2 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-xs font-medium text-navy-600 hover:border-navy-300 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export Panel
                  </button>
                )}
              </div>

              {/* Advisor response grid */}
              <div className={cn(
                'grid gap-4',
                panelResults.length <= 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'
              )}>
                {panelResults.map((result) => {
                  const advisor = ADVISORS.find((a) => a.id === result.advisorId)!;
                  return (
                    <div key={result.advisorId} className="rounded-xl border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-4">
                      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[var(--color-app-border)]">
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-serif text-[10px] font-semibold"
                          style={{ backgroundColor: advisor.color + '15', color: advisor.color }}
                        >
                          {advisor.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-navy-900 truncate">{advisor.name}</p>
                          <p className="text-[10px] truncate" style={{ color: advisor.color }}>{advisor.title}</p>
                        </div>
                        {result.loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-navy-400 shrink-0" />}
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {result.response ? (
                          <div className="text-xs text-navy-700 leading-relaxed">
                            <MarkdownRenderer content={result.response} />
                            {result.loading && (
                              <span className="inline-block h-3 w-0.5 animate-pulse ml-0.5" style={{ backgroundColor: advisor.color }} />
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-navy-400">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Consulting {advisor.name.split(' ')[0]}...
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Panel Synthesis */}
              <div className="rounded-xl border border-diplomatic-blue/20 bg-diplomatic-blue/3 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-diplomatic-blue" />
                  <p className="text-sm font-semibold text-navy-900">Panel Synthesis</p>
                  {synthesisLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-navy-400" />}
                </div>
                {panelSynthesis ? (
                  <div className="text-sm text-navy-700 leading-relaxed">
                    <MarkdownRenderer content={panelSynthesis} />
                    {synthesisLoading && (
                      <span className="inline-block h-3 w-0.5 animate-pulse bg-diplomatic-blue ml-0.5" />
                    )}
                  </div>
                ) : panelLoading ? (
                  <p className="text-xs text-navy-400">Synthesis will generate after all advisors respond...</p>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-navy-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Generating synthesis...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Advisory Brief Modal
// ============================================================================

function AdvisoryBriefModal({
  situation,
  situationContext,
  onClose,
}: {
  situation?: Situation | null;
  situationContext: string;
  onClose: () => void;
}) {
  const [selectedAdvisors, setSelectedAdvisors] = useState<string[]>([]);
  const [briefTopic, setBriefTopic] = useState('');
  const [briefContent, setBriefContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [phase, setPhase] = useState<'setup' | 'generating' | 'done'>('setup');
  const [phaseLabel, setPhaseLabel] = useState('');

  const toggleAdvisor = (id: string) => {
    setSelectedAdvisors((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const generateBrief = useCallback(async () => {
    if (!briefTopic.trim() || selectedAdvisors.length === 0) return;
    setIsGenerating(true);
    setPhase('generating');
    setBriefContent('');

    const advisorPerspectives: Array<{ name: string; title: string; content: string }> = [];

    for (const advisorId of selectedAdvisors) {
      const advisor = ADVISORS.find((a) => a.id === advisorId)!;
      setPhaseLabel(`Consulting ${advisor.name}...`);
      try {
        const res = await fetch('/api/ai/advisor-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{
              role: 'user',
              content: `For an advisory brief on the topic: "${briefTopic}", provide your expert perspective in 2-3 focused paragraphs. Be specific and actionable.`,
            }],
            advisorId,
            deepAnalysis: false,
            situation: situation || undefined,
          }),
        });
        if (res.ok && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let accumulated = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const parsed = parseDataStreamChunk(decoder.decode(value, { stream: true }));
            if (parsed) accumulated += parsed;
          }
          advisorPerspectives.push({ name: advisor.name, title: advisor.title, content: accumulated });
        }
      } catch {
        advisorPerspectives.push({ name: advisor.name, title: advisor.title, content: '*Unavailable*' });
      }
    }

    // Generate synthesis brief
    setPhaseLabel('Generating advisory brief...');
    const perspectivesText = advisorPerspectives.map((p) =>
      `**${p.name} (${p.title}):**\n${p.content}`
    ).join('\n\n---\n\n');

    const briefPrompt = `You are a senior analyst synthesizing an advisory brief for PRAXIS conflict intelligence platform. Topic: "${briefTopic}"\n\nAdvisor perspectives:\n${perspectivesText}\n\nGenerate a structured advisory brief with these exact sections:\n\n# Advisory Brief: ${briefTopic}\n\n## Executive Summary\n[2-3 sentences synthesizing the overall advisory picture]\n\n## Advisor Perspectives\n[Summarize each advisor's key contribution, attributed by name]\n\n## Points of Convergence\n[Where advisors agree — these are high-confidence findings]\n\n## Points of Divergence\n[Where advisors disagree — these represent genuine analytical uncertainty]\n\n## Recommended Actions\n[3-5 concrete, prioritized actions with clear ownership]\n\nBe concise, analytical, and actionable.`;

    try {
      const synthRes = await fetch('/api/ai/advisor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: briefPrompt }],
          advisorId: 'mensah',
          deepAnalysis: false,
          situation: situation || undefined,
        }),
      });
      if (synthRes.ok && synthRes.body) {
        const reader = synthRes.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const parsed = parseDataStreamChunk(decoder.decode(value, { stream: true }));
          if (parsed) {
            accumulated += parsed;
            setBriefContent(accumulated);
          }
        }
      }
    } catch {
      setBriefContent('*Brief generation failed. Please try again.*');
    }

    setIsGenerating(false);
    setPhase('done');
    setPhaseLabel('');
  }, [briefTopic, selectedAdvisors, situation]);

  const exportBrief = useCallback(() => {
    const lines = [
      `# Advisory Brief`,
      `**Topic:** ${briefTopic}`,
      `**Date:** ${new Date().toISOString().split('T')[0]}`,
      situation ? `**Situation:** ${(situation as Situation).name}` : '',
      `**Advisors:** ${selectedAdvisors.map((id) => ADVISORS.find((a) => a.id === id)?.name).filter(Boolean).join(', ')}`,
      '',
      briefContent,
    ].filter(Boolean).join('\n');
    const blob = new Blob([lines], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `praxis-advisory-brief-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [briefTopic, briefContent, selectedAdvisors, situation]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="absolute inset-0 bg-navy-950/20 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-3xl rounded-2xl border border-[var(--color-app-border)] bg-white shadow-2xl shadow-navy-950/10 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[var(--color-app-border)] px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/10">
            <FileText className="h-4 w-4 text-gold-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-navy-900">Request Advisory Brief</h2>
            <p className="text-[11px] text-navy-400">Multi-advisor synthesis into a structured intelligence document</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-navy-400 hover:text-navy-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {phase === 'setup' && (
            <>
              <div>
                <label className="mb-2 block text-xs font-semibold text-navy-700 uppercase tracking-wide">
                  Select Advisors
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {ADVISORS.map((advisor) => {
                    const isSelected = selectedAdvisors.includes(advisor.id);
                    return (
                      <button
                        key={advisor.id}
                        onClick={() => toggleAdvisor(advisor.id)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center text-[10px] font-medium transition-all',
                          isSelected
                            ? 'border-transparent text-white'
                            : 'border-[var(--color-app-border)] text-navy-600 hover:border-navy-300 hover:bg-[var(--color-app-surface-alt)]'
                        )}
                        style={isSelected ? { backgroundColor: advisor.color } : {}}
                      >
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold font-serif"
                          style={isSelected
                            ? { backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }
                            : { backgroundColor: advisor.color + '15', color: advisor.color }
                          }
                        >
                          {advisor.avatar}
                        </div>
                        <span className="leading-tight">{advisor.name.split(' ').slice(-1)[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-navy-700 uppercase tracking-wide">
                  Brief Topic
                </label>
                <textarea
                  value={briefTopic}
                  onChange={(e) => setBriefTopic(e.target.value)}
                  placeholder="What should the advisory brief address? Be specific about the question, decision, or policy area."
                  rows={3}
                  className="w-full rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-4 py-3 text-sm text-navy-900 placeholder:text-navy-400 focus:border-gold-500/30 focus:outline-none focus:ring-2 focus:ring-gold-500/10 resize-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[10px] text-navy-400">
                  {selectedAdvisors.length} advisors × 2 credits = <strong>{selectedAdvisors.length * 2} credits</strong>
                  {' '}+ 2 credits for synthesis = <strong>{selectedAdvisors.length * 2 + 2} credits total</strong>
                </p>
                <button
                  onClick={generateBrief}
                  disabled={selectedAdvisors.length === 0 || !briefTopic.trim()}
                  className="flex items-center gap-2 rounded-lg bg-gold-500 px-5 py-2 text-sm font-medium text-white hover:bg-gold-600 disabled:opacity-50 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Generate Brief
                </button>
              </div>
            </>
          )}

          {phase === 'generating' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-4">
                <Loader2 className="h-5 w-5 animate-spin text-gold-600" />
                <div>
                  <p className="text-sm font-medium text-navy-700">Generating Advisory Brief</p>
                  <p className="text-xs text-navy-400">{phaseLabel}</p>
                </div>
              </div>
              {briefContent && (
                <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
                  <MarkdownRenderer content={briefContent} className="text-sm" />
                  <span className="inline-block h-3 w-0.5 animate-pulse bg-gold-500 ml-0.5" />
                </div>
              )}
            </div>
          )}

          {phase === 'done' && briefContent && (
            <div className="space-y-4">
              <div className="rounded-xl border border-gold-500/20 bg-gold-500/3 p-5">
                <MarkdownRenderer content={briefContent} className="text-sm" />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={exportBrief}
                  className="flex items-center gap-2 rounded-lg border border-[var(--color-app-border)] bg-white px-4 py-2 text-xs font-medium text-navy-600 hover:border-navy-300 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export as Markdown
                </button>
                <button
                  onClick={() => { setPhase('setup'); setBriefContent(''); }}
                  className="flex items-center gap-2 rounded-lg border border-[var(--color-app-border)] bg-white px-4 py-2 text-xs font-medium text-navy-600 hover:border-navy-300 transition-colors"
                >
                  New Brief
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function AdvisoryPage() {

  const { isDemo, showGuard, situation } = useSituationGuard();
  const [chatAdvisor, setChatAdvisor] = useState<AdvisorDef | null>(null);
  const [mode, setMode] = useState<'individual' | 'panel'>('individual');
  const [showConvenePanel, setShowConvenePanel] = useState(false);
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [panelMode, setPanelMode] = useState(false);
  const [selectedPanelAdvisors, setSelectedPanelAdvisors] = useState<string[]>([]);
  const [advisorRatings, setAdvisorRatings] = useState<Record<string, number>>({});

  // Load ratings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('praxis-advisor-ratings');
      if (stored) setAdvisorRatings(JSON.parse(stored) as Record<string, number>);
    } catch {
      // ignore
    }
  }, []);

  const rateAdvisor = useCallback((advisorId: string, rating: number) => {
    setAdvisorRatings((prev) => {
      const next = { ...prev, [advisorId]: rating };
      try { localStorage.setItem('praxis-advisor-ratings', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const togglePanelAdvisor = useCallback((id: string) => {
    setSelectedPanelAdvisors((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }, []);

  const situationContext = useMemo(() => {
    if (situation) return buildSituationContext(situation as Situation);
    return 'No active situation context available. Provide general expert analysis.';
  }, [situation]);

  if (showGuard) return <NoSituationState />;

  // Derive expertise tags from the expertise string (first 3 comma-split tokens, trimmed)
  const getExpertiseTags = (expertise: string): string[] => {
    return expertise
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 3);
  };

  return (
    <div className="space-y-6">
      <RegistryToolInfo toolId="advisory" />
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-500/8">
            <Sparkles className="h-5 w-5 text-gold-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-navy-900">Advisory Council</h1>
            <p className="text-sm text-navy-500">{ADVISORS.length} AI experts with specialized domain knowledge.{situation ? ` Grounded in ${(situation as Situation).name} context.` : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Convene Panel button */}
          <button
            onClick={() => setShowConvenePanel(true)}
            className="flex items-center gap-1.5 rounded-lg border border-diplomatic-blue/30 bg-diplomatic-blue/5 px-3 py-1.5 text-xs font-medium text-diplomatic-blue hover:bg-diplomatic-blue/10 transition-colors"
          >
            <Users className="h-3.5 w-3.5" />
            Convene Panel
          </button>
          {/* Request Advisory Brief */}
          <button
            onClick={() => setShowBriefModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs font-medium text-gold-700 hover:bg-gold-500/10 transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            Advisory Brief
          </button>
          {/* Mode toggle */}
          <div className="flex rounded-lg border border-[var(--color-app-border)] bg-white p-1">
            <button
              onClick={() => setMode('individual')}
              className={cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all', mode === 'individual' ? 'bg-navy-900 text-white' : 'text-navy-500 hover:text-navy-700')}
            >
              <MessageSquare className="h-3.5 w-3.5" />Individual
            </button>
            <button
              onClick={() => setMode('panel')}
              className={cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all', mode === 'panel' ? 'bg-navy-900 text-white' : 'text-navy-500 hover:text-navy-700')}
            >
              <Users className="h-3.5 w-3.5" />Panel
            </button>
          </div>
        </div>
      </div>

      {mode === 'individual' && (
        <>
          {/* Panel mode banner */}
          {panelMode && (
            <div className="flex items-center justify-between rounded-xl border border-diplomatic-blue/20 bg-diplomatic-blue/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-diplomatic-blue" />
                <p className="text-sm font-medium text-navy-700">
                  Panel selection mode — {selectedPanelAdvisors.length} selected
                </p>
                <p className="text-xs text-navy-400">(Select 2–4 advisors, then click Convene Panel)</p>
              </div>
              <button
                onClick={() => { setPanelMode(false); setSelectedPanelAdvisors([]); }}
                className="text-xs text-navy-400 hover:text-navy-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="flex items-start gap-3 rounded-xl border border-gold-500/15 bg-gold-500/4 p-4">
            <Sparkles className="h-4 w-4 shrink-0 text-gold-600 mt-0.5" />
            <p className="text-sm text-navy-700">Each advisor has a specialized persona, domain expertise, and access to web search for current data. Toggle <strong>Deep Analysis</strong> mode in the chat for extended, research-grade responses using Gemini 2.5 Pro (5 credits).</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-5">
            {ADVISORS.map((advisor) => {
              const isPanelSelected = selectedPanelAdvisors.includes(advisor.id);
              const expertiseTags = getExpertiseTags(advisor.expertise);
              return (
                <div
                  key={advisor.id}
                  className={cn(
                    'group rounded-xl border bg-white p-5 transition-all hover:shadow-md hover:shadow-navy-950/5 relative',
                    panelMode
                      ? isPanelSelected
                        ? 'border-diplomatic-blue ring-2 ring-diplomatic-blue/20'
                        : 'border-[var(--color-app-border)] hover:border-diplomatic-blue/40 cursor-pointer'
                      : 'border-[var(--color-app-border)] hover:border-navy-300'
                  )}
                  onClick={panelMode ? () => togglePanelAdvisor(advisor.id) : undefined}
                >
                  {/* Panel mode checkbox overlay */}
                  {panelMode && (
                    <div className="absolute top-3 right-3">
                      {isPanelSelected
                        ? <CheckSquare className="h-5 w-5 text-diplomatic-blue" />
                        : <Square className="h-5 w-5 text-navy-300" />
                      }
                    </div>
                  )}

                  {/* Avatar + name + rating row */}
                  <div className="mb-3 flex items-start gap-3">
                    <AdvisorAvatar advisor={advisor} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-navy-900 leading-tight">{advisor.name}</h3>
                      <p className="text-xs font-medium mt-0.5" style={{ color: advisor.color }}>{advisor.title}</p>
                      {/* Star rating */}
                      <div className="mt-1.5">
                        <StarRating
                          advisorId={advisor.id}
                          ratings={advisorRatings}
                          onRate={rateAdvisor}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expertise tags */}
                  <div className="mb-3 flex flex-wrap gap-1">
                    {expertiseTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                        style={{ backgroundColor: advisor.color + '15', color: advisor.color }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <p className="mb-3 text-xs text-navy-500 leading-relaxed">{advisor.bio}</p>

                  {/* Database badges */}
                  <div className="mb-3">
                    <p className="mb-1 text-[10px] font-semibold text-navy-400 uppercase tracking-wide">Data Sources</p>
                    <DatabaseBadges databases={advisor.databases} />
                  </div>

                  <div className="mb-4 space-y-1.5">
                    <p className="text-[10px] font-semibold text-navy-400 uppercase tracking-wide">Suggested questions</p>
                    {advisor.suggestedPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={(e) => { e.stopPropagation(); setChatAdvisor(advisor); }}
                        className="block w-full rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-3 py-2 text-left text-[11px] text-navy-600 hover:border-navy-300 hover:text-navy-800 transition-colors"
                      >
                        <ChevronRight className="inline h-3 w-3 mr-1 text-navy-300" />
                        {prompt}
                      </button>
                    ))}
                  </div>

                  {/* Key Resources (collapsible) */}
                  <AdvisorResources advisor={advisor} />

                  <div className="flex items-center justify-between border-t border-[var(--color-app-border)] pt-4">
                    <div className="flex items-center gap-1.5 text-xs text-sage font-medium">
                      <div className="h-2 w-2 rounded-full bg-sage animate-pulse" />Online
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setChatAdvisor(advisor); }}
                      className="flex items-center gap-1.5 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-xs font-medium text-navy-700 transition-all hover:border-gold-500/30 hover:bg-gold-500/5 hover:text-gold-700"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />Consult
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {mode === 'panel' && (
        <>
          <div className="flex items-start gap-3 rounded-xl border border-diplomatic-blue/15 bg-diplomatic-blue/4 p-4">
            <Users className="h-4 w-4 shrink-0 text-diplomatic-blue mt-0.5" />
            <div className="text-sm text-navy-700">
              <p>Panel Discussion sends your question to multiple advisors simultaneously. Compare different expert perspectives side-by-side in real time.</p>
              <p className="mt-1 text-[11px] text-navy-500">Advisors who are <span className="text-sage font-medium">likely aligned</span> share analytical frameworks. Those with <span className="text-alert-red font-medium">likely tension</span> may offer competing assessments — this is where the best insights emerge.</p>
            </div>
          </div>
          <PanelDiscussion
            situationContext={situationContext}
            situation={situation as Situation | null}
            panelMode={panelMode}
            selectedAdvisors={selectedPanelAdvisors}
            togglePanelAdvisor={togglePanelAdvisor}
          />
        </>
      )}

      {/* Chat modal */}
      {chatAdvisor && (
        <AdvisorChatPanel advisor={chatAdvisor} onClose={() => setChatAdvisor(null)} situationContext={situationContext} situation={situation as Situation | null} />
      )}

      {/* Convene Panel modal */}
      {showConvenePanel && (
        <ConvenePanelModal
          situation={situation as Situation | null}
          situationContext={situationContext}
          onClose={() => setShowConvenePanel(false)}
        />
      )}

      {/* Advisory Brief modal */}
      {showBriefModal && (
        <AdvisoryBriefModal
          situation={situation as Situation | null}
          situationContext={situationContext}
          onClose={() => setShowBriefModal(false)}
        />
      )}
    </div>
  );
}
