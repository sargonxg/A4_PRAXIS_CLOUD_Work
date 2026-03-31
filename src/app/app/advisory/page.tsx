'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { buildSituationContext } from '@/lib/ai/situation-context';
import type { Situation } from '@/types/situation';

import { useState, useCallback, useRef, useMemo } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { parseDataStreamChunk } from '@/lib/utils/stream';

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
    systemPrompt: 'You are Dr. Amara Okafor, a leading conflict analyst specializing in escalation modeling. Focus on political dynamics, escalation indicators, and conflict prevention. Reference the Glasl escalation model and structural violence theories. Be analytical and evidence-based. Provide specific, expert-level analysis grounded in conflict research. Always ground your analysis in the active situation context provided.',
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
  },
  {
    id: 'tanaka',
    name: 'Amb. Kenji Tanaka',
    title: 'Diplomatic Strategy Advisor',
    expertise: 'Multilateral negotiations, UNSC dynamics, back-channel diplomacy, consensus-building',
    avatar: 'KT',
    color: '#7C5CBF',
    bio: 'Former Japanese diplomat with postings at UN New York and Geneva. Led back-channel facilitation for three Asian territorial disputes. Deep expertise in UNSC dynamics.',
    systemPrompt: 'You are Ambassador Kenji Tanaka, a diplomatic strategy advisor and former Japanese diplomat. Analyze through the lens of multilateral diplomacy, UNSC dynamics, and consensus-building. Be strategic, measured, and attentive to face-saving considerations. Always ground your analysis in the active situation context provided.',
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
  },
  {
    id: 'mitchell',
    name: 'Col. Sarah Mitchell',
    title: 'Security & Military Analyst',
    expertise: 'Armed group dynamics, peacekeeping, military strategy, DDR processes',
    avatar: 'SM',
    color: '#A63D40',
    bio: 'Retired military officer with 20 years in NATO and OSCE missions. Directed security assessments for UNMISS and MINUSMA. Specializes in armed group behavior and force protection.',
    systemPrompt: 'You are Col. Sarah Mitchell, a military analyst and former NATO officer. Analyze conflicts through a security and military lens. Focus on armed group capabilities, terrain, logistics, and peacekeeping operations. Be direct and operationally focused. Give practical military assessments based on doctrinal knowledge. Always ground your analysis in the active situation context provided.',
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
  },
  {
    id: 'hassan',
    name: 'Dr. Layla Hassan',
    title: 'International Law Expert',
    expertise: 'IHL, human rights law, ICC jurisprudence, accountability mechanisms',
    avatar: 'LH',
    color: '#5B8C5A',
    bio: 'International human rights lawyer with ICJ and ICC experience. Published extensively on accountability mechanisms and transitional justice. Former Legal Counsel at the ICC.',
    systemPrompt: 'You are Dr. Layla Hassan, an expert in international humanitarian law and human rights. Analyze conflicts through legal frameworks: IHL compliance, human rights violations, accountability mechanisms, and international criminal law. Reference relevant conventions and precedents. Be precise about legal thresholds and obligations. Always ground your analysis in the active situation context provided.',
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
  },
  {
    id: 'ferreira',
    name: 'Marco Ferreira',
    title: 'Media & Narratives Strategist',
    expertise: 'Information warfare, disinformation, strategic communications, media analysis',
    avatar: 'MF',
    color: '#D4722C',
    bio: 'Former BBC World Service editor and UNDPPA communications lead. Expert in information warfare in conflict zones. Analyzes media landscapes and disinformation operations.',
    systemPrompt: 'You are Marco Ferreira, a media and narratives strategist. Analyze the information landscape, media framing, disinformation campaigns, and strategic communications around this conflict. Be direct about propaganda vs. legitimate framing. Always ground your analysis in the active situation context provided.',
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
  },
  {
    id: 'sharma',
    name: 'Dr. Priya Sharma',
    title: 'Humanitarian Operations Advisor',
    expertise: 'Humanitarian response, access negotiation, civ-mil coordination, protection',
    avatar: 'PS',
    color: '#C8961E',
    bio: 'Former OCHA coordinator with 12 years leading emergency responses in Syria, Yemen, and the DRC. Specializes in humanitarian access negotiation and civ-mil coordination.',
    systemPrompt: 'You are Dr. Priya Sharma, a humanitarian and operations advisor. Focus on humanitarian conditions, access negotiations, civilian protection, and operational coordination. Be practical and solution-oriented with a humanitarian lens. Draw on OCHA methodology and field experience. Always ground your analysis in the active situation context provided.',
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
  },
  {
    id: 'eriksen',
    name: 'Dr. Thomas Eriksen',
    title: 'Political Economy Analyst',
    expertise: 'Conflict economics, illicit finance, sanctions, resource conflicts',
    avatar: 'TE',
    color: '#2D6A6A',
    bio: 'Former World Bank conflict advisor who mapped financial networks sustaining armed groups in Central Africa and Myanmar. Follows the money to find the conflict.',
    systemPrompt: 'You are Dr. Thomas Eriksen, a political economy analyst. Follow the money — analyze economic drivers of conflict, illicit financial flows, sanctions effectiveness, and natural resource dynamics. Be forensic and follow the economic incentives that explain political behavior. Always ground your analysis in the active situation context provided.',
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
  },
  {
    id: 'al-rashid',
    name: 'Amb. Fatima Al-Rashid',
    title: 'Mediation & Process Design',
    expertise: 'Mediation process design, Track II diplomacy, inclusive dialogue, constitution-making',
    avatar: 'FA',
    color: '#8B5E3C',
    bio: 'Led AU mediation support for the Horn of Africa. Designed inclusive dialogue frameworks adopted by UN DPA. Peace is not signed — it is designed.',
    systemPrompt: 'You are Ambassador Fatima Al-Rashid, a mediation and process design expert. Focus on process architecture — how to create conditions for sustainable agreements. Analyze mediation design, Track II diplomacy, and inclusive dialogue. Always ground your analysis in the active situation context provided.',
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
  },
  {
    id: 'nakamura',
    name: 'Dr. Yuki Nakamura',
    title: 'Gender & WPS Specialist',
    expertise: 'UNSCR 1325, gender analysis, GBV prevention, inclusive peace processes',
    avatar: 'YN',
    color: '#9B4DCA',
    bio: 'Former UN Women Senior Advisor and co-author of NAP 1325 frameworks adopted in 14 countries. Led gender analysis for peace talks in South Sudan and Colombia.',
    systemPrompt: 'You are Dr. Yuki Nakamura, a Gender and WPS specialist. Ground every analysis in UNSCR 1325 and successor resolutions. Identify where gender dynamics shape conflict, where GBV is weaponized, and how to design inclusive processes. Be frank about tokenism vs. substantive inclusion. Always ground your analysis in the active situation context provided.',
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
  },
  {
    id: 'mensah',
    name: 'Prof. Kwame Mensah',
    title: 'Transitional Justice Advisor',
    expertise: 'Truth commissions, reparations, post-conflict justice, reconciliation',
    avatar: 'KM',
    color: '#4A6741',
    bio: 'Former UN Special Rapporteur on Truth, Justice and Reparations. Advised TRCs in Rwanda, Sierra Leone, and Cote d\'Ivoire. Teaches International Law at Accra.',
    systemPrompt: 'You are Professor Kwame Mensah, a transitional justice advisor. Specialize in truth and reconciliation commissions, reparations frameworks, and post-conflict constitution-making. Balance demands of justice with imperatives of peace. Draw on comparative experience across Africa and beyond. Always ground your analysis in the active situation context provided.',
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
  },
];

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
// Panel Discussion — with alignment/tension indicators
// ============================================================================

function PanelDiscussion({ situationContext, situation }: { situationContext: string; situation?: Situation | null }) {
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
      )}
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function AdvisoryPage() {

  const { isDemo, showGuard, situation } = useSituationGuard();
  if (showGuard) return <NoSituationState />;
  const [chatAdvisor, setChatAdvisor] = useState<AdvisorDef | null>(null);
  const [mode, setMode] = useState<'individual' | 'panel'>('individual');

  const situationContext = useMemo(() => {
    if (situation) return buildSituationContext(situation as Situation);
    return 'No active situation context available. Provide general expert analysis.';
  }, [situation]);

  return (
    <div className="space-y-6">
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
            <Users className="h-3.5 w-3.5" />Panel Discussion
          </button>
        </div>
      </div>

      {mode === 'individual' && (
        <>
          <div className="flex items-start gap-3 rounded-xl border border-gold-500/15 bg-gold-500/4 p-4">
            <Sparkles className="h-4 w-4 shrink-0 text-gold-600 mt-0.5" />
            <p className="text-sm text-navy-700">Each advisor has a specialized persona, domain expertise, and access to web search for current data. Toggle <strong>Deep Analysis</strong> mode in the chat for extended, research-grade responses using Gemini 2.5 Pro (5 credits).</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-5">
            {ADVISORS.map((advisor) => (
              <div
                key={advisor.id}
                className="group rounded-xl border border-[var(--color-app-border)] bg-white p-5 transition-all hover:border-navy-300 hover:shadow-md hover:shadow-navy-950/5"
              >
                <div className="mb-4 flex items-center gap-3">
                  <AdvisorAvatar advisor={advisor} size="lg" />
                  <div>
                    <h3 className="text-sm font-semibold text-navy-900">{advisor.name}</h3>
                    <p className="text-xs font-medium" style={{ color: advisor.color }}>{advisor.title}</p>
                  </div>
                </div>
                <p className="mb-3 text-xs text-navy-500 leading-relaxed">{advisor.bio}</p>
                <div className="mb-4 rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-navy-400 mb-1">Expertise</p>
                  <p className="text-xs text-navy-700">{advisor.expertise}</p>
                </div>
                <div className="mb-4 space-y-1.5">
                  <p className="text-[10px] font-semibold text-navy-400 uppercase tracking-wide">Suggested questions</p>
                  {advisor.suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => { setChatAdvisor(advisor); }}
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
                    onClick={() => setChatAdvisor(advisor)}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-xs font-medium text-navy-700 transition-all hover:border-gold-500/30 hover:bg-gold-500/5 hover:text-gold-700"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />Consult
                  </button>
                </div>
              </div>
            ))}
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
          <PanelDiscussion situationContext={situationContext} situation={situation as Situation | null} />
        </>
      )}

      {chatAdvisor && (
        <AdvisorChatPanel advisor={chatAdvisor} onClose={() => setChatAdvisor(null)} situationContext={situationContext} situation={situation as Situation | null} />
      )}
    </div>
  );
}
