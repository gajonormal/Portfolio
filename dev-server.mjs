import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import { Readable } from 'node:stream';
import { createAdminHandler, previewStore } from './admin-server.mjs';
import { findCapture } from './api/wayback.mjs';
import { contributions } from './api/contributions.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT) || 4174;
const origin = `http://127.0.0.1:${port}`;
const admin = createAdminHandler({
  store: previewStore(),
  origin,
  passwordHash: process.env.MAIA_ADMIN_PASSWORD_HASH,
  local: true
});
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.mp3': 'audio/mpeg'
};

const server = http.createServer(async (req, res) => {
  let parsed;
  let decoded;

  try {
    parsed = new URL(req.url, 'http://localhost');
    decoded = decodeURIComponent(parsed.pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }

  if (decoded === '/api/contributions' || decoded === '/dist/api/contributions') {
    const result = await contributions(new Request(origin + decoded, { method: req.method }));
    res.writeHead(result.status, Object.fromEntries(result.headers));
    res.end(await result.text());
    return;
  }

  if (decoded === '/api/wayback' || decoded === '/dist/api/wayback') {
    const result = await findCapture(new Request(origin + decoded + parsed.search, { method: req.method }));
    res.writeHead(result.status, Object.fromEntries(result.headers));
    res.end(await result.text());
    return;
  }

  if (decoded === '/api/desktop-layout' || decoded === '/dist/api/desktop-layout') {
    const body = ['GET', 'HEAD'].includes(req.method)
      ? {}
      : { body: Readable.toWeb(req), duplex: 'half' };
    const result = await admin(new Request(origin + decoded, {
      method: req.method,
      headers: req.headers,
      ...body
    }));
    res.writeHead(result.status, Object.fromEntries(result.headers));
    res.end(Buffer.from(await result.arrayBuffer()));
    return;
  }

  const file = path.resolve(root, '.' + (decoded === '/' ? '/index.html' : decoded));
  if (!file.startsWith(root + path.sep)) {
    res.writeHead(403).end();
    return;
  }

  const isPlaylist = decoded === '/music/playlist.json' || decoded === '/dist/music/playlist.json';
  const type = isPlaylist ? 'application/json; charset=utf-8' : types[path.extname(file)];
  if (!type) {
    res.writeHead(404).end();
    return;
  }

  try {
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': type,
      'Cache-Control': 'no-store'
    });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Local: ${origin}`));
