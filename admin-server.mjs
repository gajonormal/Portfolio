import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const derive = promisify(scrypt);
const passwordOptions = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const desktopIds = ['finder', 'portrait', 'cv', 'notes', 'github'];
const extraDesktopIds = ['linkedin', 'visitar', 'nethergate', 'abisso', 'oportunia', 'ipod'];
const dockIds = ['finder', 'mail', 'safari', 'notes', 'settings'];
const wallpapers = ['galaxy', 'horizon', 'earth-horizon', 'leopard-aurora', 'snow-leopard-prowl'];
const maxPdfBytes = 3 * 1024 * 1024;
const maxPdfEncoded = Math.ceil(maxPdfBytes / 3) * 4;
const maxStickiesBytes = 280000;
const stickyColours = ['yellow', 'blue', 'purple', 'green', 'pink', 'orange'];
const sessionSeconds = 30 * 60;
const attemptsSeconds = 5 * 60;

export async function hashPassword(password, salt = randomBytes(16)) {
  const hash = await derive(password, salt, 32, passwordOptions);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function validLayout(layout) {
  if (
    !layout ||
    typeof layout !== 'object' ||
    Array.isArray(layout) ||
    Object.keys(layout).some(key => !['desktop', 'dock', 'wallpaper', 'hasCv', 'cv', 'stickies'].includes(key))
  ) return false;
  const { desktop, dock, hasCv = false, wallpaper = 'galaxy' } = layout;
  if (typeof hasCv !== 'boolean' || !wallpapers.includes(wallpaper)) return false;
  if (layout.stickies !== undefined && !validStickies(layout.stickies)) return false;
  if (
    !desktop ||
    Array.isArray(desktop) ||
    !desktopIds.every(id => Object.hasOwn(desktop, id)) ||
    Object.keys(desktop).some(id => !desktopIds.includes(id) && !extraDesktopIds.includes(id))
  ) return false;
  if (
    !Array.isArray(dock) ||
    dock.length !== dockIds.length ||
    !dockIds.every(id => dock.includes(id))
  ) return false;
  return Object.keys(desktop).every(id => {
    const point = desktop[id];
    return point === null || (
      Array.isArray(point) &&
      point.length === 2 &&
      point.every(value => Number.isFinite(value) && value >= 0 && value <= 1)
    );
  });
}

function validStickies(settings) {
  if (!settings || typeof settings.shortcut !== 'boolean' ||
      !Array.isArray(settings.notes) || settings.notes.length > 12 ||
      Buffer.byteLength(JSON.stringify(settings)) > maxStickiesBytes) return false;
  const ids = new Set();
  const text = (value, max) => typeof value === 'string' && value.length <= max;
  for (const note of settings.notes) {
    if (!note || !text(note.id, 48) || !/^[a-z0-9-]+$/.test(note.id) || ids.has(note.id) ||
        !text(note.title, 64) || !text(note.text, 2000) || !text(note.linkLabel, 64) ||
        !text(note.link, 256) || (note.link && !/^(https?:\/\/|mailto:)[^\s]+$/i.test(note.link)) ||
        !stickyColours.includes(note.colour) || typeof note.visible !== 'boolean' ||
        !Array.isArray(note.images) || note.images.length > 4 ||
        !note.images.every(image => image === 'monke' || validStickyImage(image))) return false;
    ids.add(note.id);
  }
  return true;
}

function validStickyImage(image) {
  if (typeof image !== 'string' || !/^data:image\/webp;base64,[A-Za-z0-9+/]+={0,2}$/.test(image)) return false;
  const encoded = image.slice('data:image/webp;base64,'.length);
  const bytes = Buffer.from(encoded, 'base64');
  return bytes.length <= 48 * 1024 && bytes.toString('base64') === encoded &&
    bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
}

function validPdf(encoded) {
  if (typeof encoded !== 'string' || encoded.length > maxPdfEncoded) return false;
  const pdf = Buffer.from(encoded, 'base64');
  return pdf.length <= maxPdfBytes &&
    pdf.subarray(0, 5).toString() === '%PDF-' &&
    pdf.toString('base64') === encoded;
}

const digest = value => createHash('sha256').update(value).digest('hex');
const json = (body, status = 200, headers = {}) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers }
});
const error = (message, status, headers) => json({ error: message }, status, headers);

async function readJson(request, maxBytes) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Missing body');
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      return JSON.parse(text + decoder.decode());
    }
    bytes += value.byteLength;
    if (bytes > maxBytes) {
      await reader.cancel();
      throw new Error('Body too large');
    }
    text += decoder.decode(value, { stream: true });
  }
}

export function isAdminEnabled({ store, origin, passwordHash }) {
  return Boolean(store && origin && /^[a-f0-9]{32}:[a-f0-9]{64}$/.test(passwordHash));
}

export function createAdminHandler({ store, origin, passwordHash, local = false }) {
  const enabled = isAdminEnabled({ store, origin, passwordHash });
  const cookieName = local ? 'maia_admin_local' : '__Host-maia_admin';
  const cookie = (value, age) =>
    `${cookieName}=${value}; Max-Age=${age}; Path=/; HttpOnly; SameSite=Strict${local ? '' : '; Secure'}`;
  const passwordVersion = enabled ? digest(passwordHash) : '';

  return async request => {
    try {
      if (request.method === 'GET') {
        if (new URL(request.url).searchParams.has('cv')) {
          const pdf = enabled ? await store.getCv() : null;
          if (!pdf) return error('No CV has been published.', 404);
          return new Response(Buffer.from(pdf, 'base64'), {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': 'inline; filename="CV.pdf"',
              'Cache-Control': 'no-store',
              'X-Content-Type-Options': 'nosniff'
            }
          });
        }
        return json({ enabled, layout: enabled ? await store.getLayout() : null });
      }
      if (!enabled) return error('Administration is unavailable.', 503);
      if (
        request.headers.get('origin') !== origin ||
        request.headers.get('content-type')?.split(';')[0] !== 'application/json'
      ) {
        return error('Request origin or format rejected.', 403);
      }
      const token = request.headers
        .get('cookie')
        ?.match(new RegExp(`(?:^|;\s*)${cookieName}=([a-f0-9]{64})(?:;|$)`))?.[1];
      const session = token ? digest(passwordVersion + token) : '';

      if (request.method === 'DELETE') {
        if (session) await store.logout(session);
        return json({}, 200, { 'Set-Cookie': cookie('', 0) });
      }
      if (request.method !== 'POST' && request.method !== 'PUT') {
        return error('Method not allowed.', 405, { Allow: 'GET, POST, PUT, DELETE' });
      }
      if (request.method === 'PUT' && !session) return error('Unlock the desktop first.', 401);
      let body;
      try {
        body = await readJson(request, request.method === 'PUT' ? maxPdfEncoded + maxStickiesBytes + 4096 : 4096);
      } catch {
        return error('Invalid request.', 400);
      }

      if (request.method === 'POST') {
        if (typeof body?.password !== 'string' || !body.password || body.password.length > 256) {
          return error('Enter a valid password.', 400);
        }
        if (await store.countAttempt(attemptsSeconds) > 8) {
          return error('Too many attempts. Try again in five minutes.', 429, { 'Retry-After': String(attemptsSeconds) });
        }
        const [salt, expected] = passwordHash.split(':');
        const [, actual] = (await hashPassword(body.password, Buffer.from(salt, 'hex'))).split(':');
        if (!timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(actual, 'hex'))) {
          return error('Incorrect password.', 401);
        }
        const layout = await store.getLayout();
        const newToken = randomBytes(32).toString('hex');
        await store.startSession(digest(passwordVersion + newToken), sessionSeconds);
        return json({ layout }, 200, { 'Set-Cookie': cookie(newToken, sessionSeconds) });
      }

      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return error('Invalid desktop settings.', 400);
      }
      const { cvPdf, ...layout } = body;
      if (!validLayout(layout)) return error('Invalid desktop settings.', 400);
      if (cvPdf !== undefined && !validPdf(cvPdf)) return error('Choose a valid PDF up to 3 MB.', 400);
      const saved = await store.saveLayout(session, {
        desktop: layout.desktop,
        dock: layout.dock,
        wallpaper: layout.wallpaper ?? 'galaxy'
      }, cvPdf, layout.stickies);
      if (!saved) return error('Session expired. Unlock the desktop again.', 401);
      return json({ layout: saved });
    } catch {
      return error('Desktop administration is temporarily unavailable.', 503);
    }
  };
}

export function redisStore(url, token) {
  const endpoint = new URL(url);
  if (endpoint.protocol !== 'https:') throw new Error('Redis REST URL must use HTTPS');
  const prefix = 'maia-osx:v1:';
  const session = prefix + 'session';
  const layout = prefix + 'layout';
  const cv = prefix + 'cv-pdf';
  const stickies = prefix + 'stickies';
  const attempts = prefix + 'attempts';
  const run = async (...command) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(4000),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(command)
    });
    if (!response.ok) throw new Error('Storage unavailable');
    const body = await response.json();
    if (body.error) throw new Error('Storage command failed');
    return body.result;
  };
  function readLayout([desktopJson, stickiesJson]) {
    const data = JSON.parse(desktopJson);
    if (!validLayout(data)) return null;
    const notes = JSON.parse(stickiesJson || 'null');
    return validStickies(notes) ? { ...data, stickies: notes } : data;
  }
  return {
    async getLayout() {
      return readLayout(await run('MGET', layout, stickies));
    },
    getCv: () => run('GET', cv),
    countAttempt: seconds => run(
      'EVAL',
      "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n",
      1,
      attempts,
      seconds
    ),
    startSession: (value, seconds) => run(
      'EVAL',
      "redis.call('SET',KEYS[1],ARGV[1],'EX',ARGV[2]); redis.call('DEL',KEYS[2]); return 1",
      2,
      session,
      attempts,
      value,
      seconds
    ),
    logout: value => run(
      'EVAL',
      "if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end; return 0",
      1,
      session,
      value
    ),
    saveLayout: async (value, data, pdf, notes) => {
      const saved = await run(
        'EVAL',
        `if redis.call('GET',KEYS[1])~=ARGV[1] then return nil end
         if ARGV[3]~='' then redis.call('SET',KEYS[3],ARGV[3]) end
         if ARGV[4]~='' then redis.call('SET',KEYS[4],ARGV[4]) end
         local settings=cjson.decode(ARGV[2])
         settings.hasCv=redis.call('EXISTS',KEYS[3])==1
         local saved=cjson.encode(settings)
         redis.call('SET',KEYS[2],saved)
         return {saved,redis.call('GET',KEYS[4])}`,
        4,
        session,
        layout,
        cv,
        stickies,
        value,
        JSON.stringify(data),
        pdf ?? '',
        notes === undefined ? '' : JSON.stringify(notes)
      );
      return saved && readLayout(saved);
    }
  };
}

// A loopback-only preview, separate from the published layout.
export function previewStore() {
  let layout = null;
  let cv = null;
  let session;
  let expires = 0;
  let attempts = 0;
  let attemptsExpire = 0;
  return {
    getLayout: () => layout,
    getCv: () => cv,
    countAttempt(seconds) {
      if (Date.now() >= attemptsExpire) {
        attempts = 0;
        attemptsExpire = Date.now() + seconds * 1000;
      }
      return ++attempts;
    },
    startSession(value, seconds) {
      session = value;
      expires = Date.now() + seconds * 1000;
      attempts = 0;
    },
    logout(value) {
      if (session === value) session = undefined;
    },
    saveLayout(value, data, pdf, notes) {
      if (session !== value || Date.now() >= expires) return false;
      cv = pdf ?? cv;
      notes ??= layout?.stickies;
      layout = { ...data, hasCv: cv !== null, ...(notes && { stickies: notes }) };
      return layout;
    }
  };
}
