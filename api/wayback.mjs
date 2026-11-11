const cdx = 'https://web.archive.org/cdx/search/cdx';
const reply = (body, status = 200) => Response.json(body, {
  status, headers: { 'Cache-Control': status === 200 ? 'public, max-age=300, s-maxage=86400' : 'no-store' }
});

function webAddress(value) {
  if (!value || value.length > 300) return null;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
        !/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(url.hostname) || url.hostname.endsWith('.local')) return null;
    url.hash = '';
    return url.href;
  } catch {
    return null;
  }
}

export async function findCapture(request, fetchCapture = fetch) {
  if (request.method !== 'GET') return reply({ error: 'Method not allowed.' }, 405);
  const params = new URL(request.url).searchParams;
  const address = webAddress(params.get('url'));
  const year = params.get('year');
  if (!address || !/^\d{4}$/.test(year) || +year < 1996 || +year > new Date().getFullYear()) {
    return reply({ error: 'Enter a website address and a valid year.' }, 400);
  }

  const query = new URL(cdx);
  query.search = new URLSearchParams({
    url: address, from: year, to: year, matchType: 'exact', output: 'json',
    fl: 'timestamp,original', filter: 'statuscode:200', limit: '1'
  });
  try {
    const response = await fetchCapture(query, { redirect: 'error', signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('Wayback lookup failed');
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error('Unexpected Wayback response');
    const [timestamp, original] = rows[1] || [];
    if (!timestamp) return reply({ capture: null });
    if (typeof timestamp !== 'string' || !/^\d{14}$/.test(timestamp) ||
        !timestamp.startsWith(year) || !webAddress(original)) throw new Error('Invalid capture');
    return reply({ capture: { timestamp, url: `https://web.archive.org/web/${timestamp}/${original}` } });
  } catch {
    return reply({ error: 'The Wayback index is temporarily unavailable.' }, 503);
  }
}

export default { fetch: request => findCapture(request) };
