import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    // Demo research results
    const results = {
      query,
      timestamp: new Date().toISOString(),
      sources: [
        {
          title: 'UN News: Special Representative Briefs Security Council on Nordalia',
          url: 'https://news.un.org/en/story/2026/02/nordalia',
          snippet: 'The Special Representative of the Secretary-General for Nordalia, Maria Santos, briefed the Security Council on progress in implementing the Framework Agreement...',
          date: '2026-02-27',
          reliability: 0.95,
        },
        {
          title: 'Reuters: Nordalia parties agree on transitional timeline',
          url: 'https://reuters.com/world/africa/nordalia-timeline-2026',
          snippet: 'Representatives of the Government of Nordalia and the Democratic Reform Movement have agreed on a detailed implementation timeline for the January Framework Agreement...',
          date: '2026-02-25',
          reliability: 0.92,
        },
        {
          title: 'Al Jazeera: Analysis - Can the Nordalia peace process survive?',
          url: 'https://aljazeera.com/features/nordalia-peace-analysis',
          snippet: 'As the parties move towards implementation of the Framework Agreement, analysts warn that spoiler dynamics and regional competition could derail progress...',
          date: '2026-02-23',
          reliability: 0.78,
        },
        {
          title: 'International Crisis Group: Nordalia - Making the Framework Agreement Work',
          url: 'https://crisisgroup.org/africa/nordalia-framework',
          snippet: 'The Framework Agreement is a significant achievement, but its success depends on addressing three key challenges: security sector reform, electoral preparations, and transitional justice...',
          date: '2026-02-20',
          reliability: 0.90,
        },
        {
          title: 'BBC: Nordalia ceasefire violations decrease amid renewed diplomacy',
          url: 'https://bbc.com/news/world-africa-nordalia',
          snippet: 'Ceasefire violations in Nordalia have decreased by 25 per cent in the latest reporting period, according to the UN peacekeeping mission...',
          date: '2026-02-18',
          reliability: 0.88,
        },
      ],
      summary: 'The situation in Nordalia shows cautious progress. The Framework Agreement signed in January 2026 has created a pathway for political resolution, though implementation challenges remain significant. Key areas of concern include the security sector reform timeline, regional power dynamics, and the capacity of transitional institutions.',
    };

    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: 'Research request failed' }, { status: 500 });
  }
}
