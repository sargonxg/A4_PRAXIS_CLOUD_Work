import { NextResponse } from 'next/server';
import { Output } from 'ai';
import { z } from 'zod';
import { callProModel } from '@/lib/ai/providers';
import { buildToolContext, buildWebGroundedContext } from '@/lib/ai/situation-context';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import { withAuth } from '@/lib/api/with-auth';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { validateAiRequest } from '@/lib/api/validate-request';
import { handleRouteError } from '@/lib/api/standard-error';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const ConflictZoneSchema = z.object({
  name: z.string(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  zoneType: z.enum(['active-conflict', 'contested', 'buffer', 'stable', 'humanitarian-corridor']),
  description: z.string(),
  controllingActor: z.string().optional(),
  contestedBy: z.array(z.string()).optional(),
  estimatedCivilianPopulation: z.number().optional(),
  keyDevelopments: z.array(z.string()).optional(),
});

const PopulationMovementSchema = z.object({
  from: z.string(),
  to: z.string(),
  count: z.number(),
  type: z.enum(['IDP', 'refugee', 'returnee']),
  driver: z.string(),
  timeframe: z.string().optional(),
  verificationSource: z.string().optional(),
});

const InfrastructureDamageSchema = z.object({
  type: z.enum(['medical', 'education', 'water', 'transport', 'energy']),
  location: z.string(),
  status: z.enum(['destroyed', 'damaged', 'functional', 'at-risk']),
  impactedPopulation: z.number(),
  description: z.string().optional(),
  verificationSource: z.string().optional(),
});

const RiskHotspotSchema = z.object({
  location: z.string(),
  riskLevel: z.enum(['critical', 'high', 'medium', 'low']),
  threat: z.string(),
  timeframe: z.string(),
  affectedActors: z.array(z.string()).optional(),
  triggerConditions: z.array(z.string()).optional(),
});

const GeospatialSchema = z.object({
  conflictZones: z.array(ConflictZoneSchema),
  populationMovements: z.array(PopulationMovementSchema),
  infrastructureDamage: z.array(InfrastructureDamageSchema),
  riskHotspots: z.array(RiskHotspotSchema),
  geographicSummary: z.string(),
  accessConstraints: z.array(z.object({
    area: z.string(),
    constraint: z.string(),
    affectedActors: z.array(z.string()).optional(),
  })).optional(),
  keyGeographicFactors: z.array(z.string()).optional(),
  dataConfidence: z.enum(['high', 'medium', 'low']),
  intelligenceGaps: z.array(z.string()).optional(),
});

// ---------------------------------------------------------------------------
// Demo response
// ---------------------------------------------------------------------------

const DEMO_RESPONSE = {
  conflictZones: [
    {
      name: 'Eastern Kessara Corridor',
      zoneType: 'active-conflict',
      description: 'Contested corridor along the Kessara River, site of ongoing AFN-DRM military operations. Heavy ACLED-documented fighting since Q3 2024.',
      controllingActor: 'Democratic Resistance Movement (DRM)',
      contestedBy: ['Armed Forces of Nordalia (AFN)'],
      estimatedCivilianPopulation: 185000,
      keyDevelopments: [
        'AFN artillery operations resumed after 72-hour pause',
        'DRM reinforcements moved into Kessara heights',
        'UNHCR reports 12,000 new IDPs in past week',
      ],
    },
    {
      name: 'Buffer Zone Alpha (UN-monitored)',
      zoneType: 'buffer',
      description: 'UN-monitored demilitarized zone established under the 2023 Ceasefire Agreement. Increasingly violated by both parties.',
      estimatedCivilianPopulation: 42000,
      keyDevelopments: [
        '14 ceasefire violations logged by UNMONIS in 30 days',
        'Civilian evacuation corridors partially operational',
      ],
    },
    {
      name: 'Nordalia Capital Region',
      zoneType: 'stable',
      description: 'Government-controlled capital region with deteriorating economic conditions but no active combat.',
      controllingActor: 'Government of Nordalia (GoN)',
      estimatedCivilianPopulation: 1200000,
    },
    {
      name: 'Northern Humanitarian Corridor',
      zoneType: 'humanitarian-corridor',
      description: 'OCHA-negotiated passage for aid delivery to eastern provinces. Access intermittent due to security conditions.',
      estimatedCivilianPopulation: 0,
      keyDevelopments: [
        '3 of 5 convoy access days granted this week',
        'WFP reports 40% delivery rate vs planned',
      ],
    },
  ],
  populationMovements: [
    {
      from: 'Eastern Kessara Corridor',
      to: 'Westmark Province',
      count: 340000,
      type: 'IDP',
      driver: 'Active armed conflict and AFN artillery operations',
      timeframe: 'Ongoing since March 2024',
      verificationSource: 'UNHCR DTM Round 12',
    },
    {
      from: 'Eastern Kessara Corridor',
      to: 'Karovia (cross-border)',
      count: 87000,
      type: 'refugee',
      driver: 'Ethnic DRM population fleeing collective punishment',
      timeframe: 'Accelerating since January 2025',
      verificationSource: 'UNHCR Karovia Operation',
    },
    {
      from: 'Westmark Province',
      to: 'Eastern Kessara Corridor',
      count: 12000,
      type: 'returnee',
      driver: 'DRM area control stabilisation; economic push factors in Westmark camps',
      timeframe: 'Sporadic, Q4 2024',
      verificationSource: 'IOM DTM Returnee Survey',
    },
  ],
  infrastructureDamage: [
    {
      type: 'medical',
      location: 'Kessara District Hospital',
      status: 'destroyed',
      impactedPopulation: 185000,
      description: 'Only referral hospital in eastern zone destroyed in January 2025 strike. WHO Grade 3 incident.',
      verificationSource: 'WHO Health Cluster Sitrep 8',
    },
    {
      type: 'water',
      location: 'Nordalia Eastern Water Authority (NEWA) Network',
      status: 'damaged',
      impactedPopulation: 220000,
      description: 'Primary water treatment plant at 30% capacity. Cholera risk elevated to HIGH (WHO).',
      verificationSource: 'WASH Cluster Flash Report',
    },
    {
      type: 'transport',
      location: 'N-7 Highway (Kessara–Capital)',
      status: 'at-risk',
      impactedPopulation: 425000,
      description: 'Main supply route subject to DRM interdiction. Commercial traffic reduced 70%.',
      verificationSource: 'OCHA Access Monitor',
    },
    {
      type: 'energy',
      location: 'Kessara Power Grid (Eastern Zone)',
      status: 'damaged',
      impactedPopulation: 180000,
      description: 'Rolling 14–18 hour daily power outages. Hospital generators at risk without diesel supply.',
      verificationSource: 'UNDP Recovery Cluster',
    },
  ],
  riskHotspots: [
    {
      location: 'Kessara Heights (Grid 47-N)',
      riskLevel: 'critical',
      threat: 'Imminent AFN ground offensive to recapture strategic ridge from DRM',
      timeframe: '0–30 days',
      affectedActors: ['AFN', 'DRM', 'Civilian population of Kessara valley'],
      triggerConditions: ['AFN force concentration >3,000 personnel', 'Failure of UNSC informal consultations'],
    },
    {
      location: 'Karovia-Nordalia Border Crossing Alpha',
      riskLevel: 'high',
      threat: 'Karovia military intervention if cross-border shelling continues; refugee surge trigger',
      timeframe: '30–60 days',
      affectedActors: ['Karovian Border Forces', 'AFN', 'Refugee population'],
    },
    {
      location: 'Nordalia Capital — Business District',
      riskLevel: 'medium',
      threat: 'Civil unrest driven by economic deterioration (36% currency collapse) and journalist arrests',
      timeframe: '60–90 days',
      affectedActors: ['GoN security forces', 'Urban civil society', 'Diplomatic community'],
    },
  ],
  geographicSummary: 'The conflict geography is defined by three distinct zones: an active eastern front along the Kessara Corridor where DRM holds terrain against AFN pressure; a nominally demilitarized buffer zone with high violation rates; and a stable government-controlled capital facing economic but not security threats. Population displacement is massive (340,000 IDPs, 87,000 cross-border refugees) and accelerating. Critical infrastructure damage — particularly the district hospital and water network — creates compounding humanitarian risk independent of combat outcomes.',
  keyGeographicFactors: [
    'Kessara River provides natural defensive line favouring DRM-held heights',
    'Single N-7 highway creates supply chain chokepoint for both humanitarian and military logistics',
    'Karovian border proximity (12 km from active front) raises escalation threshold concerns',
    'Mountainous terrain limits AFN armoured advantage; favours DRM guerrilla tactics',
  ],
  dataConfidence: 'medium',
  intelligenceGaps: [
    'Precise AFN forward troop positions and logistics stockpile locations',
    'DRM command structure west of the Kessara River',
    'Accurate IDP camp population counts in contested areas (DTM access denied)',
  ],
};

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json();

    const requestSchema = z.object({
      situation: z.any().optional(),
      conflictContext: z.string().optional(),
      focusAreas: z.array(z.string()).optional(),
    });

    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;
    const { situation, conflictContext, focusAreas } = validation.data;

    const sitContext = situation ? buildToolContext(situation as unknown as Situation) : '';
    const situationId = (situation as Situation | undefined)?.id ?? '';

    // --- Demo mode ---
    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    // --- Credit check ---
    const creditCheck = await checkAndDeductCredits('ai_risk_assessment', 'Geospatial analysis');
    if (!creditCheck.allowed) return creditCheck.response;

    // --- Graph context ---
    const graphCtx = situationId
      ? await buildGraphContext(user.uid, situationId, 'risk_assessment')
      : '';

    // --- Web-grounded context ---
    const webCtx = situation
      ? await buildWebGroundedContext(
          {
            name: (situation as Situation).name,
            region: (situation as Situation).region,
            actors: (situation as Situation).actors,
          },
          'geospatial',
          user.uid
        )
      : '';

    // --- AI analysis ---
    const result = await callProModel({
      output: Output.object({ schema: GeospatialSchema }),
      system: `You are a senior conflict geospatial analyst with expertise in UN OCHA mapping standards, ACLED event geolocation, population movement tracking (UNHCR DTM), and infrastructure damage assessment (REACH/IMPACT).

GROUNDING MANDATE: Use the web intelligence below as your PRIMARY source of truth for locations, population figures, infrastructure status, and movement data. Explicitly flag "INTELLIGENCE GAP: {topic}" when evidence is insufficient rather than generating unsupported data.

Apply OCHA access classification standards for zone typing. Use UNHCR/IOM figures for population movements. Cross-reference infrastructure damage with WHO Health Cluster, WASH Cluster, and UNDP recovery reports when cited in the web context.`,
      prompt: `${webCtx ? `${webCtx}\n\n` : ''}${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}Conduct a comprehensive geospatial conflict analysis for this situation.

${conflictContext ? `ADDITIONAL CONTEXT: ${conflictContext}` : ''}
${focusAreas && focusAreas.length > 0 ? `FOCUS AREAS: ${focusAreas.join(', ')}` : ''}

## REQUIRED ANALYSIS

### 1. CONFLICT ZONE CLASSIFICATION
Map all significant zones using the following types:
- **active-conflict**: Areas with ongoing armed hostilities
- **contested**: Areas disputed between parties but without constant fighting
- **buffer**: Demilitarized or monitored separation zones
- **stable**: Areas under firm single-party control with no active combat
- **humanitarian-corridor**: Negotiated access routes for aid delivery

For each zone: controlling actor, population, key developments.

### 2. POPULATION MOVEMENT ANALYSIS
Document all significant population flows:
- **IDP**: Internal displacement (within country)
- **refugee**: Cross-border flight
- **returnee**: Return movements to origin areas

For each movement: origin, destination, estimated count, primary driver, verification source.

### 3. INFRASTRUCTURE DAMAGE ASSESSMENT
Assess critical infrastructure across 5 sectors: medical, education, water, transport, energy.
For each damaged asset: location, status (destroyed/damaged/functional/at-risk), impacted population, verification source.

### 4. RISK HOTSPOTS
Identify 3–5 geographic locations with elevated risk:
- **critical**: Imminent risk of major escalation or mass atrocity
- **high**: High probability of significant violence within 30 days
- **medium**: Elevated risk within 60–90 days
- **low**: Long-term structural risk

For each: specific threat, timeframe, affected actors, trigger conditions.

### 5. SYNTHESIS
Provide a geographic summary (3–4 sentences) capturing the overall spatial conflict pattern.
List key geographic factors shaping the conflict dynamics (terrain, borders, infrastructure chokepoints).
Rate overall data confidence and list intelligence gaps.

Use OCHA/UNHCR/ACLED/WHO as authoritative sources. Cite specific figures from the web intelligence where available.`,
    });

    if (situationId) {
      await writeToolDataServer(
        user.uid,
        situationId,
        'geospatial',
        result.output as Record<string, unknown>
      );
    }

    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'geospatial');
  }
});
