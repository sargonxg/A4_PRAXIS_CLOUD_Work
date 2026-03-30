/**
 * Lightweight iCal (.ics) parser for importing calendar events.
 * Parses VEVENT components from iCal format into CalendarEvent objects.
 *
 * Supports: DTSTART, DTEND, SUMMARY, DESCRIPTION, LOCATION, URL
 * Does not require external dependencies.
 */

export interface ParsedCalendarEvent {
  id: string;
  title: string;
  date: string;      // YYYY-MM-DD
  time: string;      // HH:MM
  endTime?: string;   // HH:MM
  description: string;
  location?: string;
  url?: string;
  source: string;     // Feed name/URL
}

/**
 * Parse an iCal string into an array of calendar events.
 */
export function parseICal(icalText: string, source: string): ParsedCalendarEvent[] {
  const events: ParsedCalendarEvent[] = [];
  const eventBlocks = icalText.split('BEGIN:VEVENT');

  for (let i = 1; i < eventBlocks.length; i++) {
    const block = eventBlocks[i].split('END:VEVENT')[0];
    if (!block) continue;

    const get = (key: string): string => {
      const regex = new RegExp(`^${key}[;:](.*)$`, 'm');
      const match = block.match(regex);
      return match ? unfold(match[1].trim()) : '';
    };

    const dtstart = get('DTSTART');
    const dtend = get('DTEND');
    const summary = get('SUMMARY');
    const description = get('DESCRIPTION');
    const location = get('LOCATION');
    const url = get('URL');
    const uid = get('UID') || `ical-${i}-${Date.now()}`;

    if (!summary || !dtstart) continue;

    const { date, time } = parseICalDate(dtstart);
    const endParsed = dtend ? parseICalDate(dtend) : null;

    events.push({
      id: uid,
      title: unescapeICal(summary),
      date,
      time,
      endTime: endParsed?.time,
      description: unescapeICal(description),
      location: location ? unescapeICal(location) : undefined,
      url: url || undefined,
      source,
    });
  }

  // Sort by date+time
  events.sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  return events;
}

/**
 * Parse iCal date string (20260329T140000Z or 20260329) into date + time.
 */
function parseICalDate(dt: string): { date: string; time: string } {
  // Strip TZID= prefix if present
  const clean = dt.replace(/^.*:/, '');
  const year = clean.slice(0, 4);
  const month = clean.slice(4, 6);
  const day = clean.slice(6, 8);
  const hour = clean.length >= 13 ? clean.slice(9, 11) : '00';
  const minute = clean.length >= 13 ? clean.slice(11, 13) : '00';
  return { date: `${year}-${month}-${day}`, time: `${hour}:${minute}` };
}

/**
 * Unfold iCal line continuations (lines starting with space/tab are continuations).
 */
function unfold(text: string): string {
  return text.replace(/\r?\n[ \t]/g, '');
}

/**
 * Unescape iCal special characters.
 */
function unescapeICal(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

/**
 * Fetch and parse an iCal feed from a URL (server-side only).
 */
export async function fetchICalFeed(url: string, source: string): Promise<ParsedCalendarEvent[]> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'PRAXIS-TACITUS/1.0' },
    });
    if (!res.ok) return [];
    const text = await res.text();
    return parseICal(text, source);
  } catch (err) {
    console.error(`[ical] Failed to fetch ${source}:`, err);
    return [];
  }
}

// Well-known institutional calendar feed URLs
export const INSTITUTIONAL_FEEDS: { id: string; label: string; url: string; color: string }[] = [
  {
    id: 'un-meetings',
    label: 'UN Security Council',
    url: 'https://journal.un.org/meetings/ical',
    color: '#4B92DB',
  },
  {
    id: 'osce',
    label: 'OSCE Events',
    url: 'https://www.osce.org/calendar/ical',
    color: '#1B6B93',
  },
];
