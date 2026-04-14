import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getProModel } from '@/lib/ai/providers';
import { buildToolContext, buildWebGroundedContext } from '@/lib/ai/situation-context';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import { withAuth } from '@/lib/api/with-auth';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { validateAiRequest } from '@/lib/api/validate-request';
import { handleRouteError } from '@/lib/api/standard-error';
import { situationContextSchema } from '@/lib/api/schemas';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

const TreatySchema = z.object({
  treaties: z.array(
    z.object({
      name: z.string().describe('Full name of the treaty or international legal instrument'),
      type: z.enum(['bilateral', 'multilateral', 'regional', 'UN-charter', 'IHL', 'IHRL', 'trade', 'environmental']).describe('Treaty category'),
      parties: z.array(z.string()).describe('States or entities party to the instrument'),
      status: z.enum(['in-force', 'signed-not-ratified', 'proposed', 'violated', 'suspended']).describe('Current legal status of the treaty'),
      relevanceToConflict: z.string().describe('How this treaty is directly relevant to the current conflict dynamics'),
      keyObligations: z.array(z.string()).describe('Core legal obligations the treaty imposes on parties'),
      complianceIssues: z.array(
        z.object({
          party: z.string().describe('Party whose compliance is being assessed'),
          obligation: z.string().describe('Specific obligation under review'),
          status: z.enum(['compliant', 'partial', 'non-compliant', 'unclear']).describe('Compliance status'),
        })
      ).describe('Specific compliance issues by party and obligation'),
      enforcementMechanism: z.string().describe('Available enforcement mechanisms (ICJ, treaty bodies, UNSC, peer review, none)'),
      ICJRelevance: z.boolean().describe('Whether the International Court of Justice has jurisdiction or pending proceedings related to this treaty'),
    })
  ).describe('Treaties and international legal instruments applicable to this conflict'),
  legalFrameworkAssessment: z.object({
    applicableIHL: z.array(z.string()).describe('International Humanitarian Law instruments applicable to this conflict (Geneva Conventions, Additional Protocols, etc.)'),
    applicableIHRL: z.array(z.string()).describe('International Human Rights Law instruments applicable to the parties'),
    jurisdictionalGaps: z.array(z.string()).describe('Gaps in the legal framework — areas where no enforceable instrument applies or enforcement is structurally absent'),
  }).describe('Assessment of the overall international legal framework applicable to this conflict'),
  legalOpportunities: z.array(z.string()).describe('Diplomatic and legal opportunities created by the treaty architecture — e.g., ICJ referrals, treaty body communications, UN Charter mechanisms'),
});

const DEMO_RESPONSE = {
  treaties: [
    {
      name: 'Geneva Conventions (1949) and Additional Protocols I and II (1977)',
      type: 'IHL' as const,
      parties: ['Republic of Nordalia', 'Universally applicable as customary IHL'],
      status: 'in-force' as const,
      relevanceToConflict: 'Primary legal framework governing the conduct of hostilities in Nordalia. The non-international armed conflict character of the Nordalia conflict triggers Common Article 3 and Additional Protocol II obligations for all parties including the DRM. The arms embargo and reported civilian targeting are directly governed by IHL norms.',
      keyObligations: [
        'Protection of civilians and civilian objects from direct attack (AP I Article 48, customary IHL Rule 1)',
        'Prohibition of indiscriminate attacks (AP I Article 51(4))',
        'Humane treatment of all persons not taking part in hostilities (Common Article 3)',
        'Facilitation of humanitarian assistance to civilian populations in need (AP II Article 18)',
        'Protection of medical personnel, facilities, and transport (GC IV Article 18)',
        'Prohibition of starvation as a method of warfare (AP II Article 14)',
      ],
      complianceIssues: [
        {
          party: 'Government of Nordalia (AFN)',
          obligation: 'Protection of civilians — prohibition of indiscriminate attacks',
          status: 'non-compliant' as const,
        },
        {
          party: 'Government of Nordalia',
          obligation: 'Humanitarian access facilitation',
          status: 'non-compliant' as const,
        },
        {
          party: 'Democratic Reform Movement',
          obligation: 'Common Article 3 — humane treatment of persons not taking part in hostilities',
          status: 'partial' as const,
        },
        {
          party: 'Democratic Reform Movement',
          obligation: 'Prohibition of looting and pillage',
          status: 'partial' as const,
        },
      ],
      enforcementMechanism: 'ICRC bilateral confidential engagement; UN Human Rights Monitoring Mission; UNSC referral to ICC (would require P5 unity); domestic military courts (Nordalia)',
      ICJRelevance: false,
    },
    {
      name: 'UN Charter — Article 2(4) and Chapter VII',
      type: 'UN-charter' as const,
      parties: ['Republic of Nordalia', 'Republic of Karovia', 'Federal Republic of Westmark', 'all UN Member States'],
      status: 'in-force' as const,
      relevanceToConflict: 'Karovia\'s documented arms transfers to the AFN in violation of the UNSC arms embargo may constitute support for the use of force contrary to Article 2(4). The UNSC Chapter VII measures (Resolution 2847) create binding obligations on all Member States including Karovia.',
      keyObligations: [
        'Article 2(4): Refrain from the threat or use of force against territorial integrity of any state',
        'Article 25: Obligations to accept and carry out UNSC decisions',
        'Chapter VII, Resolution 2847: Arms embargo binding on all Member States',
        'Article 2(3): Obligation to settle international disputes by peaceful means',
      ],
      complianceIssues: [
        {
          party: 'Republic of Karovia',
          obligation: 'UNSC Resolution 2847 arms embargo — Article 25 obligation',
          status: 'non-compliant' as const,
        },
        {
          party: 'Republic of Nordalia',
          obligation: 'Cooperation with Panel of Experts (UNSC Resolution 2847, para. 14)',
          status: 'non-compliant' as const,
        },
        {
          party: 'Federal Republic of Westmark',
          obligation: 'Arms embargo enforcement within its jurisdiction',
          status: 'compliant' as const,
        },
      ],
      enforcementMechanism: 'UNSC Sanctions Committee; Panel of Experts investigation; potential UNSC action under Chapter VII (constrained by P5 veto)',
      ICJRelevance: false,
    },
    {
      name: 'African Union Constitutive Act — Article 4(h)',
      type: 'regional' as const,
      parties: ['Republic of Nordalia', 'Republic of Karovia', 'all AU Member States'],
      status: 'in-force' as const,
      relevanceToConflict: 'Article 4(h) grants the AU the right to intervene in a Member State in cases of genocide, war crimes, or crimes against humanity. The documented scale of civilian harm in Nordalia and reported starvation tactics may reach the threshold for AU intervention consideration.',
      keyObligations: [
        'Article 4(h): AU right to intervene in grave circumstances',
        'Article 4(e): Peaceful resolution of conflicts',
        'Article 4(j): Non-aggression between Member States',
      ],
      complianceIssues: [
        {
          party: 'Republic of Nordalia',
          obligation: 'Article 4(e) — peaceful resolution; Article 4(j) — territorial integrity obligations',
          status: 'partial' as const,
        },
        {
          party: 'Republic of Karovia',
          obligation: 'Article 4(j) — non-aggression (arms transfers)',
          status: 'non-compliant' as const,
        },
      ],
      enforcementMechanism: 'AU Peace and Security Council; AU Panel of the Wise; AU-led mediation (currently active); AU Summit political pressure',
      ICJRelevance: false,
    },
    {
      name: 'Nordalia-Karovia Treaty of Friendship and Cooperation (2018)',
      type: 'bilateral' as const,
      parties: ['Republic of Nordalia', 'Republic of Karovia'],
      status: 'violated' as const,
      relevanceToConflict: 'The bilateral Treaty of Friendship provides Karovia with legal cover for military cooperation with Nordalia, which it invokes to justify arms transfers. However, the cooperation provisions are subordinate to UNSC binding resolutions under Article 103 of the UN Charter. Westmark and the AU have called for the treaty to be suspended.',
      keyObligations: [
        'Article 7: Military cooperation and defence assistance',
        'Article 12: Non-interference in domestic affairs',
        'Article 15: Joint dispute resolution mechanism',
      ],
      complianceIssues: [
        {
          party: 'Republic of Karovia',
          obligation: 'Article 7 arms transfers — in conflict with UNSC Resolution 2847 (UN Charter Article 103 supremacy)',
          status: 'non-compliant' as const,
        },
      ],
      enforcementMechanism: 'Bilateral dispute resolution mechanism (Article 15); suspended in practice. Subject to UN Charter Article 103 override.',
      ICJRelevance: false,
    },
    {
      name: 'International Covenant on Civil and Political Rights (ICCPR)',
      type: 'IHRL' as const,
      parties: ['Republic of Nordalia'],
      status: 'in-force' as const,
      relevanceToConflict: 'Nordalia\'s detention of journalists and human rights defenders, restrictions on freedom of movement, and suppression of political opposition constitute ICCPR violations directly relevant to the conflict\'s political dimension and international legitimacy of the GoN.',
      keyObligations: [
        'Article 6: Right to life',
        'Article 9: Freedom from arbitrary detention',
        'Article 19: Freedom of expression and press freedom',
        'Article 21: Freedom of peaceful assembly',
      ],
      complianceIssues: [
        {
          party: 'Republic of Nordalia',
          obligation: 'Article 9 — arbitrary detention of journalists and political activists',
          status: 'non-compliant' as const,
        },
        {
          party: 'Republic of Nordalia',
          obligation: 'Article 19 — press freedom and access restrictions',
          status: 'non-compliant' as const,
        },
      ],
      enforcementMechanism: 'UN Human Rights Committee (individual communications under Optional Protocol); Universal Periodic Review; Special Procedures (Special Rapporteur on freedom of expression)',
      ICJRelevance: false,
    },
  ],
  legalFrameworkAssessment: {
    applicableIHL: [
      'Geneva Convention IV (1949) — Protection of Civilian Persons in Time of War',
      'Additional Protocol II (1977) — Protection of Victims of Non-International Armed Conflicts',
      'Customary IHL (ICRC Study, 2005) — Rules 1-161, universally applicable',
      'Rome Statute of the International Criminal Court — individual criminal responsibility for war crimes',
    ],
    applicableIHRL: [
      'International Covenant on Civil and Political Rights (ICCPR) — binding on Nordalia',
      'International Covenant on Economic, Social and Cultural Rights (ICESCR) — binding on Nordalia',
      'Convention Against Torture (CAT) — binding on Nordalia',
      'African Charter on Human and Peoples\' Rights — binding on Nordalia and Karovia as AU members',
      'UN Convention on the Rights of the Child — binding on Nordalia',
    ],
    jurisdictionalGaps: [
      'DRM is a non-state actor and cannot be a party to treaties — IHL obligations bind it under customary law but treaty-based accountability mechanisms are inaccessible',
      'Nordalia has not accepted the ICC\'s jurisdiction by ratification of the Rome Statute — UNSC referral (requiring P5 unity) is the only ICC pathway and is politically blocked',
      'No bilateral investment treaty mechanism exists to address economic harm claims by displaced populations',
      'Karovia\'s arms transfers exploit a gap in the bilateral Treaty of Friendship — no international mechanism exists to challenge treaty invocation that conflicts with UNSC resolutions short of ICJ proceedings',
      'Customary IHL obligations apply to Karovia\'s facilitation of arms transfers but no treaty body has jurisdiction to adjudicate state responsibility for third-party conflict involvement at this level',
    ],
  },
  legalOpportunities: [
    'Initiate a UNSC referral to the ICC for investigation of war crimes in the Eastern Provinces — while P5 unity is currently lacking, formal proposal creates accountability pressure and can shift negotiating dynamics',
    'File individual communications to the UN Human Rights Committee under the ICCPR Optional Protocol regarding detained journalists — creates binding finding obligations and international legitimacy pressure on GoN',
    'Request an Advisory Opinion from the International Court of Justice on the legality of Karovia\'s arms transfers under the UN Charter Article 25 / Article 103 framework',
    'Invoke the African Charter on Human and Peoples\' Rights complaint mechanism before the African Commission — accessible for civil society organizations and creates AU-internal accountability pressure',
    'Submit a formal report to the UNSC Sanctions Committee documenting Karovian non-compliance with Resolution 2847, requesting the Committee issue a determination and consider individual listings',
    'Engage the ICRC to formalize a Deed of Commitment from the DRM under IHL — the San Remo Institute framework enables non-state actors to assume IHL obligations with verification mechanisms',
  ],
};

export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json();
    const requestSchema = z.object({ situation: situationContextSchema.optional() });
    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;
    const { situation } = validation.data;
    const sitContext = situation ? buildToolContext(situation as unknown as Situation) : '';
    const situationId = (situation as Situation | undefined)?.id ?? '';

    if (isServerDemoMode()) return NextResponse.json(DEMO_RESPONSE);
    const creditCheck = await checkAndDeductCredits('ai_treaty_analyze', 'Treaty analysis');
    if (!creditCheck.allowed) return creditCheck.response;

    const graphCtx = situationId ? await buildGraphContext(user.uid, situationId, 'treaty_analyzer') : '';
    const webCtx = situation
      ? await buildWebGroundedContext(
          { name: (situation as unknown as Situation).name, region: (situation as unknown as Situation).region, actors: (situation as unknown as Situation).actors },
          'treaty-analyzer', user.uid
        )
      : '';

    const result = await generateText({
      model: getProModel(),
      output: Output.object({ schema: TreatySchema }),
      system: 'You are a senior international law expert specializing in treaty analysis, international humanitarian law (IHL), international human rights law (IHRL), and UN Charter law. You have deep expertise in ICJ proceedings, UNSC enforcement mechanisms, ICC jurisdiction, and treaty body complaint procedures. Provide rigorous, citation-grounded legal analysis suitable for senior legal advisors, diplomatic counsels, and UN special representatives.',
      prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}${webCtx}
Conduct a comprehensive international legal framework analysis for this conflict situation.

For each applicable treaty or international legal instrument, assess:
1. Treaty type, parties, and current legal status
2. Relevance to the specific conflict dynamics (not generic relevance — be specific)
3. Key obligations binding on the parties
4. Specific compliance issues by party and obligation, with status classification
5. Available enforcement mechanisms and their practical effectiveness
6. ICJ jurisdiction or pending proceedings relevance

Then provide:
- IHL framework: which specific Geneva Convention provisions, Additional Protocols, and customary IHL rules apply
- IHRL framework: which human rights treaty obligations bind the state parties
- Jurisdictional gaps: where the legal framework fails to provide enforceable accountability
- Legal opportunities: specific, actionable legal strategies that could create accountability pressure or diplomatic leverage

Reference specific treaty articles, UNSC resolutions, ICJ case law, and ICRC customary IHL rules. Cite web intelligence for current treaty status and compliance documentation.`,
    });

    if (situationId) await writeToolDataServer(user.uid, situationId, 'treaty_analyzer', result.output as Record<string, unknown>);
    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'treaty-analyzer');
  }
});
