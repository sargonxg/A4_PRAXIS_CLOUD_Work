import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { source, topic } = await request.json();

    // Demo media analysis
    const analysis = {
      source: source || 'Unknown Source',
      topic: topic || 'General conflict reporting',
      assessment: {
        politicalOrientation: 0.1,
        reliability: 0.72,
        editorialIndependence: 0.65,
        type: 'private',
        country: 'Unknown',
        description: `${source || 'This source'} is a media outlet that provides coverage of international affairs with a moderate editorial stance.`,
        knownBiases: [
          'Tends to favor official government narratives in initial reporting',
          'Coverage of humanitarian issues can be sensationalized',
          'Limited local sourcing in conflict zones',
        ],
        coverageStrengths: [
          'Strong international correspondent network',
          'Timely breaking news coverage',
          'Good access to diplomatic sources',
        ],
        languages: ['English'],
        conflictCoverageNotes: topic
          ? `On ${topic}, this source has provided regular but sometimes surface-level coverage, relying primarily on official statements and wire service reports rather than independent field reporting.`
          : 'General conflict reporting tends to follow established narratives with limited independent investigation.',
      },
      comparisonNotes: 'For comprehensive conflict analysis, cross-reference with wire services (Reuters, AP) and specialized outlets (International Crisis Group, ACLED).',
    };

    return NextResponse.json(analysis);
  } catch {
    return NextResponse.json({ error: 'Media analysis failed' }, { status: 500 });
  }
}
