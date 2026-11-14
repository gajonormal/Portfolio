import { isIP } from 'node:net';
import { createAdminHandler, redisStore } from '../admin-server.mjs';

const { MAIA_ADMIN_ORIGIN, MAIA_ADMIN_PASSWORD_HASH, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;
const handler = createAdminHandler({
  origin: MAIA_ADMIN_ORIGIN?.startsWith('https://') ? MAIA_ADMIN_ORIGIN : null,
  passwordHash: MAIA_ADMIN_PASSWORD_HASH,
  store: UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN
    ? redisStore(UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN) : null,
  getClientAddress(request) {
    const address = request.headers.get('x-vercel-forwarded-for');
    if (!address || !isIP(address)) return null;
    return address;
  }
});

export default { fetch: handler };
