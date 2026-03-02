import { NextRequest } from 'next/server';

// Demo response templates based on keywords
const DEMO_RESPONSES: Record<string, { tools?: { name: string; query: string; result: string }[]; content: string }> = {
  search: {
    tools: [
      {
        name: 'webSearch',
        query: 'latest developments in conflict zone',
        result: 'Found 5 relevant results from Reuters, UN News, Al Jazeera, BBC, and France24.',
      },
    ],
    content: `Based on my research, here are the latest developments:\n\n**Key Findings:**\n\n1. **Diplomatic Track**: Negotiations between the primary parties resumed on 28 February 2026 under the auspices of the Special Representative. Both sides have indicated willingness to discuss a revised framework for power-sharing arrangements.\n\n2. **Security Situation**: The ceasefire, while broadly holding, has seen localized violations in the northern districts. UNMIN has documented 12 incidents in the past week, though none escalated significantly.\n\n3. **Humanitarian Concerns**: Access constraints persist in the eastern corridor. Approximately 45,000 displaced persons remain in temporary settlements with limited access to basic services.\n\n4. **Regional Dynamics**: Neighboring states continue to play divergent roles. Eastland has publicly reaffirmed support for the incumbent government, while Westmark has called for inclusive dialogue.\n\n*Sources: Reuters (28 Feb 2026), UN News (27 Feb 2026), Al Jazeera (26 Feb 2026)*`,
  },
  draft: {
    tools: [
      {
        name: 'draftSection',
        query: 'Drafting diplomatic briefing section',
        result: 'Section drafted using UN editorial standards.',
      },
    ],
    content: `Here is a draft briefing section:\n\n---\n\n## Situation Overview\n\n1. The reporting period was marked by cautious optimism as the parties to the conflict in Nordalia engaged in a new round of negotiations facilitated by the United Nations Mission in Nordalia (UNMIN). The Framework Agreement on power-sharing arrangements, initialed on 15 January 2026, provided a foundation for discussions, though significant obstacles remain.\n\n2. The security situation remained fragile but relatively stable. While the September 2025 ceasefire agreement has broadly held, localized violations continued to be reported, particularly in the northern districts adjacent to the border with Eastland. UNMIN military observers documented 47 ceasefire violations during the reporting period, compared with 63 in the preceding period.\n\n3. The humanitarian situation continued to require sustained attention. The Office for the Coordination of Humanitarian Affairs estimates that 1.2 million people remain in need of humanitarian assistance, including approximately 340,000 internally displaced persons.\n\n---\n\n*This draft follows UN Secretary-General report format with numbered paragraphs and standard terminology.*`,
  },
  analyze: {
    tools: [
      {
        name: 'queryConflictGraph',
        query: 'Analyzing conflict dynamics and actor relationships',
        result: 'Retrieved 12 actors, 8 commitments, and 15 relationships from knowledge graph.',
      },
    ],
    content: `## Conflict Analysis: The Nordalia Crisis\n\n### Actor Mapping\n\nThe conflict involves **10 principal actors** operating across three tiers:\n\n**Primary Parties:**\n- *Government of Nordalia* (President Osei): Controls state apparatus, security forces, and international recognition. Seeks to maintain power following disputed elections.\n- *Democratic Reform Movement (DRM)* (Commander Asante): Controls significant territory in the west. Demands new elections under international supervision.\n\n**Mediators:**\n- *UNMIN / SRSG Santos*: Mandated by UNSC to facilitate dialogue. Leverages international legitimacy.\n- *African Union Panel*: Provides regional mediation framework. Coordinates with UNMIN.\n\n**Regional Actors:**\n- *Republic of Eastland*: Government ally. Provides economic support, alleged military assistance.\n- *Federal Republic of Westmark*: Sympathetic to DRM. Hosts refugee populations.\n\n### Key Dynamics\n\n1. **Power Asymmetry**: The government holds the advantage of international recognition and state resources, but DRM controls economically significant western territories.\n2. **Spoiler Risk**: Hardliners within both parties oppose compromise. The military wing of DRM has shown greater willingness to negotiate than the political leadership.\n3. **Regional Competition**: The Eastland-Westmark rivalry overlays the domestic conflict, complicating external mediation efforts.\n\n### Assessment\n\nThe Framework Agreement represents a genuine opportunity, but implementation faces significant challenges. The commitment gap — between what leaders have initialed and what their constituencies will accept — remains the primary risk to the peace process.`,
  },
  terminology: {
    tools: [
      {
        name: 'checkUNTerminology',
        query: 'Checking text against UN editorial standards',
        result: 'Scanned text. Found 4 terminology issues.',
      },
    ],
    content: `## Terminology Review\n\nI've reviewed your text against UN editorial standards. Here are the findings:\n\n| # | Original | Suggested | Reason |\n|---|----------|-----------|--------|\n| 1 | "civil war" | "internal armed conflict" | UN avoids "civil war" for political reasons |\n| 2 | "rebels" | "armed opposition" / "non-State armed group" | Neutral terminology preferred |\n| 3 | "regime" | "government" / "authorities" | "Regime" is perceived as delegitimizing |\n| 4 | "peace-keeping" | "peacekeeping" | One word, no hyphen (UN standard) |\n\n**Additional Notes:**\n- Dates should follow format: "1 January 2026" (no ordinal suffixes)\n- Security Council resolutions should be cited as: "resolution 2254 (2015)" (lowercase "r")\n- "Member States" should be capitalized when referring to UN Members\n- Consider using "the situation in [Country]" framing for neutrality`,
  },
  default: {
    content: `Thank you for your question. Let me provide a structured analysis.\n\n**Assessment:**\n\nConflict dynamics in the current period are characterized by a tension between tactical de-escalation at the military level and persistent political deadlock on core issues. This pattern is common in protracted conflicts where ceasefire agreements outpace political settlements.\n\n**Key Observations:**\n\n1. The distinction between stated positions (claims) and underlying interests remains critical. While the parties articulate maximalist demands publicly, back-channel communications suggest greater flexibility on power-sharing modalities.\n\n2. External actors continue to shape the incentive structure. Economic leverage — particularly control of trade routes and resource revenue — provides the most effective pressure points for mediators.\n\n3. The narrative dimension deserves attention. Both parties are investing in legitimacy-building narratives that may harden positions over time, reducing the space for compromise.\n\n**Recommendation:**\n\nFocus on interest-based negotiation frameworks that decouple the elections question from governance reform. A phased approach — addressing security arrangements first, then transitional governance, then electoral framework — may prove more tractable than a comprehensive settlement attempt.\n\n*This analysis draws on the Conflict Grammar framework, examining the interplay of actors, claims, interests, and constraints.*`,
  },
};

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    const lastMessage = messages?.[messages.length - 1]?.content?.toLowerCase() || '';

    // Determine response type based on keywords
    let responseKey = 'default';
    if (lastMessage.includes('search') || lastMessage.includes('research') || lastMessage.includes('latest') || lastMessage.includes('news')) {
      responseKey = 'search';
    } else if (lastMessage.includes('draft') || lastMessage.includes('write') || lastMessage.includes('briefing') || lastMessage.includes('report')) {
      responseKey = 'draft';
    } else if (lastMessage.includes('analyze') || lastMessage.includes('analysis') || lastMessage.includes('conflict') || lastMessage.includes('actor')) {
      responseKey = 'analyze';
    } else if (lastMessage.includes('check') || lastMessage.includes('terminology') || lastMessage.includes('edit') || lastMessage.includes('review')) {
      responseKey = 'terminology';
    }

    const response = DEMO_RESPONSES[responseKey];

    // Create a streaming response that simulates AI output
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // If there are tools, send them first
        if (response.tools) {
          for (const tool of response.tools) {
            const toolData = JSON.stringify({
              type: 'tool',
              name: tool.name,
              query: tool.query,
              result: tool.result,
            });
            controller.enqueue(encoder.encode(`data: ${toolData}\n\n`));
            // Simulate tool execution delay
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }

        // Stream the content character by character (in chunks for efficiency)
        const content = response.content;
        const chunkSize = 3;
        for (let i = 0; i < content.length; i += chunkSize) {
          const chunk = content.slice(i, i + chunkSize);
          const data = JSON.stringify({ type: 'text', content: chunk });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          await new Promise((resolve) => setTimeout(resolve, 15));
        }

        // Send done signal
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
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
