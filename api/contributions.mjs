const calendarUrl = 'https://github.com/users/gajonormal/contributions';
const dayMs = 86400000;
let cached, pending;

function readCalendar(html) {
  const counts = new Map();
  for (const [, attributes, text] of html.matchAll(/<tool-tip\b([^>]*)>([^<]+)<\/tool-tip>/gi)) {
    const id = attributes.match(/\bfor="(contribution-day-component-[^"]+)"/)?.[1];
    const count = text.trim().match(/^(No|[\d,]+) contributions? on\b/i)?.[1];
    if (id && count) counts.set(id, count.toLowerCase() === 'no' ? 0 : Number(count.replaceAll(',', '')));
  }

  const days = [];
  for (const [tag] of html.matchAll(/<td\b[^>]*\bdata-date="\d{4}-\d{2}-\d{2}"[^>]*>/gi)) {
    const id = tag.match(/\bid="(contribution-day-component-[^"]+)"/)?.[1];
    const date = tag.match(/\bdata-date="([^"]+)"/)?.[1];
    const level = Number(tag.match(/\bdata-level="([0-4])"/)?.[1]);
    const count = counts.get(id);
    if (date && Number.isInteger(level) && Number.isSafeInteger(count)) days.push({ date, level, count });
  }
  days.sort((a,b) => a.date.localeCompare(b.date));
  if (days.length < 350 || days.length > 371 || days.some(({date},i) =>
    !Number.isFinite(Date.parse(date)) || (i > 0 && Date.parse(date) - Date.parse(days[i-1].date) !== dayMs))) {
    throw new Error('GitHub calendar is incomplete');
  }
  return days;
}

async function updateCalendar(day) {
  const response = await fetch(calendarUrl, {
    headers: { 'Accept-Language': 'en-US,en;q=0.9', 'User-Agent': 'MaiaArchive/1.0' },
    signal: AbortSignal.timeout(6000), redirect: 'error'
  });
  if (!response.ok) throw new Error('GitHub calendar unavailable');
  return { updated: day, days: readCalendar(await response.text()) };
}

export async function contributions(request) {
  if (request.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'GET' } });
  }
  const now = Date.now();
  const day = new Date(now).toISOString().slice(0,10);
  try {
    if (cached?.updated !== day) {
      if (pending?.day !== day) pending = { day, result: updateCalendar(day) };
      const job = pending;
      try {
        const result = await job.result;
        if (!cached || result.updated >= cached.updated) cached = result;
      } finally {
        if (pending === job) pending = null;
      }
    }
    const seconds = Math.max(0, Math.floor((Date.parse(day) + dayMs - Date.now()) / 1000));
    return Response.json(cached, {
      headers: { 'Cache-Control': `public, max-age=${Math.min(300,seconds)}, s-maxage=${seconds}` }
    });
  } catch {
    return Response.json({ error: 'GitHub calendar unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

export default { fetch: contributions };
