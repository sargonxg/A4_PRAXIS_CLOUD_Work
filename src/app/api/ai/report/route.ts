import { NextRequest } from 'next/server';

const SECTION_CONTENT: Record<string, string> = {
  executive_summary: `## Executive Summary

1. The present report covers developments in the situation in Nordalia from 1 December 2025 to 28 February 2026. The period was marked by cautious but tangible progress in the political process, following the signing of the Framework Agreement on power-sharing arrangements on 15 January 2026.

2. While the security situation remained fragile, the ceasefire established in September 2025 has broadly held, with a notable reduction in violations compared with the preceding reporting period. The United Nations Mission in Nordalia (UNMIN) documented 47 ceasefire violations, compared with 63 in the previous period, representing a 25 per cent decrease.

3. Significant challenges persist. The humanitarian situation continues to require sustained attention, with approximately 1.2 million people in need of assistance. Political polarization, while reduced, remains a concern, and the implementation timeline for the Framework Agreement faces pressure from both domestic constituencies and regional dynamics.`,

  situation_overview: `## Situation Overview

4. The reporting period witnessed a significant shift in the political trajectory of the Nordalia crisis. The Framework Agreement, initialed on 15 January 2026 by representatives of the Government of Nordalia and the Democratic Reform Movement (DRM), established the parameters for a transitional governance arrangement pending the organization of new elections.

5. The Agreement provides for a power-sharing executive, with the current President retaining the presidency while a newly created position of Executive Prime Minister would be filled by the DRM. A joint security committee would oversee the integration of armed forces, and an independent electoral commission would be established to organize elections within 18 months.

6. However, the initialing of the Agreement was followed by expressions of concern from constituencies within both parties. Elements of the ruling party have publicly questioned the concessions made on executive power, while the military wing of DRM has expressed reservations about the proposed timeline for security sector reform.

7. Regional dynamics continued to influence the situation. The Republic of Eastland maintained its support for the Government while the Federal Republic of Westmark called for what it described as a more equitable arrangement. The Special Representative has engaged with both regional actors to encourage constructive involvement in the process.`,

  political_dynamics: `## Political Dynamics

8. The political landscape during the reporting period was shaped primarily by the negotiation and aftermath of the Framework Agreement. The Special Representative of the Secretary-General, Maria Santos, conducted intensive shuttle diplomacy between the parties throughout December 2025 and January 2026, building on the foundation laid by the African Union Panel.

9. President Amara Osei's decision to accept the power-sharing formula represented a significant concession from the Government's previous position that the June 2025 election results were definitive. This shift was influenced by a combination of international pressure, economic considerations arising from the conflict's impact on state revenues, and the recognition that a military solution was unlikely to be sustainable.

10. Commander Kwame Asante, for his part, demonstrated pragmatism in accepting a transitional arrangement that fell short of the DRM's demand for immediate new elections. However, Asante faces pressure from hardliners within the movement who view the Framework Agreement as legitimizing an outcome of what they characterize as a fraudulent electoral process.

11. Civil society actors have played an increasingly visible role during the reporting period. The Nordalia Civil Society Forum organized a series of consultations across the country to gauge public sentiment regarding the Framework Agreement, finding broad but conditional support for the compromise.`,

  security_assessment: `## Security Assessment

12. The security situation during the reporting period was characterized by an overall reduction in violence, tempered by persistent tensions in specific geographic areas. The September 2025 ceasefire agreement continued to provide a framework for restraint, though compliance remained imperfect.

13. UNMIN military observers documented 47 ceasefire violations during the reporting period, down from 63 in the previous period. The majority of violations were minor in nature, consisting primarily of unauthorized troop movements and failure to notify the other party of military activities as required under the ceasefire terms.

14. The most significant security incident occurred on 8 February 2026, when an exchange of fire between Government forces and DRM elements near the town of Bakara resulted in three fatalities and several injuries. The Joint Ceasefire Monitoring Committee investigated the incident and determined that it originated from a localized command and control failure rather than a deliberate policy decision by either party.

15. The humanitarian mine action situation continued to pose challenges, particularly in formerly contested areas. UNMIN's mine action service cleared 12 square kilometres during the reporting period, but an estimated 85 square kilometres remain contaminated.`,

  recommendations: `## Observations and Recommendations

43. The Secretary-General welcomes the progress achieved during the reporting period, particularly the signing of the Framework Agreement, which represents a significant milestone in efforts to resolve the Nordalia crisis through peaceful means. However, the Secretary-General cautions that the most challenging phase of the peace process — implementation — lies ahead.

44. The Secretary-General recommends that the Security Council:

(a) Call upon the parties to finalize the outstanding technical annexes to the Framework Agreement without further delay, with a view to commencing implementation by 15 April 2026;

(b) Urge all regional stakeholders, in particular the Republic of Eastland and the Federal Republic of Westmark, to support the Framework Agreement and refrain from actions that could undermine the peace process;

(c) Authorize the strengthening of UNMIN's good offices capacity through the addition of 15 political affairs officers to support the implementation of the Agreement at the subnational level;

(d) Encourage international partners to provide the financial resources necessary to support the transitional arrangements, including the establishment of the Independent Electoral Commission;

(e) Request the Secretary-General to report on progress in the implementation of the Framework Agreement within 90 days.

45. The Secretary-General reiterates his call on all parties to prioritize the welfare of the Nordalian people and to demonstrate the political will necessary to translate the Framework Agreement into a durable and inclusive peace.`,

  key_messages: `## Key Messages

- The Framework Agreement signed on 15 January 2026 represents a genuine opportunity to resolve the Nordalia crisis. The international community must support its implementation with urgency and resources.

- While the ceasefire continues to hold broadly, the security situation remains fragile. Both parties must exercise maximum restraint and ensure their forces comply fully with ceasefire provisions.

- The humanitarian situation requires sustained attention. Access constraints in the eastern corridor must be addressed as a matter of priority.

- Regional actors play a decisive role. Constructive engagement by Eastland and Westmark is essential for the success of the peace process.

- The clock is ticking. The 18-month timeline for elections is ambitious, and delays in establishing the transitional institutions will erode public confidence in the process.`,

  talking_points: `## Talking Points

**Opening:**
The Secretary-General appreciates this opportunity to brief the Council on recent developments in Nordalia. The period since my last briefing has seen meaningful, if fragile, progress.

**On the Framework Agreement:**
- The Agreement represents the most significant political breakthrough since the crisis began in June 2025
- Credit is due to the courage of both parties and the tireless efforts of the Special Representative and the AU Panel
- However, we must be clear-eyed: an agreement on paper is only as valuable as its implementation

**On Security:**
- The overall trajectory is positive — ceasefire violations decreased by 25 per cent
- But we cannot be complacent. The Bakara incident of 8 February is a reminder of how quickly things can unravel
- Confidence-building measures, including joint patrols, must accelerate

**On Regional Dynamics:**
- I urge all Council members to use their influence with regional partners to ensure they play a constructive role
- External support for spoilers — from any direction — would be deeply irresponsible at this critical juncture`,
};

export async function POST(request: NextRequest) {
  try {
    const { sectionType, template, tone } = await request.json();

    const content = SECTION_CONTENT[sectionType] || SECTION_CONTENT.executive_summary;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        // Stream content character by character
        const chunkSize = 4;
        for (let i = 0; i < content.length; i += chunkSize) {
          const chunk = content.slice(i, i + chunkSize);
          const data = JSON.stringify({ type: 'text', content: chunk });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to generate report section' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
