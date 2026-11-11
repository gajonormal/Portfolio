import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const derive = promisify(scrypt);
const passwordOptions = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const desktopIds = ['finder', 'portrait', 'cv', 'notes', 'github'];
const extraDesktopIds = ['linkedin', 'visitar', 'nethergate', 'abisso', 'oportunia', 'ipod'];
const dockIds = ['finder', 'mail', 'safari', 'notes', 'settings'];
const sessionSeconds = 30 * 60;
const attemptsSeconds = 5 * 60;

export async function hashPassword(password, salt = randomBytes(16)) {
  const hash = await derive(password, salt, 32, passwordOptions);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function validLayout(layout) {
  if (!layout || Object.keys(layout).length !== 2) return false;
  const { desktop, dock } = layout;
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

const digest = value => createHash('sha256').update(value).digest('hex');
const json = (body, status = 200, headers = {}) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers }
});
const error = (message, status, headers) => json({ error: message }, status, headers);

async function readJson(request) {
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
    if (bytes > 4096) {
      await reader.cancel();
      throw new Error('Body too large');
    }
    text += decoder.decode(value, { stream: true });
  }
}

export function createAdminHandler({ store, origin, passwordHash, local = false }) {
  const enabled = Boolean(store && origin && /^[a-f0-9]{32}:[a-f0-9]{64}$/.test(passwordHash));
  const cookieName = local ? 'maia_admin_local' : '__Host-maia_admin';
  const cookie = (value, age) =>
    `${cookieName}=${value}; Max-Age=${age}; Path=/; HttpOnly; SameSite=Strict${local ? '' : '; Secure'}`;
  const passwordVersion = enabled ? digest(passwordHash) : '';

  return async request => {
    try {
      if (request.method === 'GET') {
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
        body = await readJson(request);
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

      if (!validLayout(body)) return error('Invalid desktop layout.', 400);
      if (!await store.saveLayout(session, body)) return error('Session expired. Unlock the desktop again.', 401);
      return json({ layout: body });
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
  return {
    async getLayout() {
      const data = JSON.parse(await run('GET', layout));
      return validLayout(data) ? data : null;
    },
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
    saveLayout: (value, data) => run(
      'EVAL',
      "if redis.call('GET',KEYS[1])~=ARGV[1] then return 0 end; redis.call('SET',KEYS[2],ARGV[2]); return 1",
      2,
      session,
      layout,
      value,
      JSON.stringify(data)
    )
  };
}

// A loopback-only preview, separate from the published layout.
export function previewStore() {
  let layout = null;
  let session;
  let expires = 0;
  let attempts = 0;
  let attemptsExpire = 0;
  return {
    getLayout: () => layout,
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
    saveLayout(value, data) {
      if (session !== value || Date.now() >= expires) return false;
      layout = data;
      return true;
    }
  };
}
