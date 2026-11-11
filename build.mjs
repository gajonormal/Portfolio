import { mkdir, copyFile, cp, readFile, rm, writeFile } from 'node:fs/promises';
import { isAdminEnabled } from './admin-server.mjs';

const copyFiles = async (files, destination) => {
	await Promise.all(files.map(file => copyFile(file, `${destination}/${file.split('/').pop()}`)));
};

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });

const rootFiles = [
	'index.html',
	'abisso-widget.html',
	'style.css',
	'snow-leopard.css',
	'safari.css',
	'script.js',
	'safari-content.js',
	'project-details.js',
	'safari.js',
	'genie.js',
	'desktop-admin.js'
];
await copyFiles(rootFiles, 'dist');

const { MAIA_ADMIN_ORIGIN, MAIA_ADMIN_PASSWORD_HASH, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;
if (isAdminEnabled({
	origin: MAIA_ADMIN_ORIGIN?.startsWith('https://'),
	passwordHash: MAIA_ADMIN_PASSWORD_HASH,
	store: UPSTASH_REDIS_REST_URL?.startsWith('https://') && UPSTASH_REDIS_REST_TOKEN
})) {
	const html = await readFile('dist/index.html', 'utf8');
	await writeFile('dist/index.html', html.replace(/(id="admin-unlock"[^>]*?)\s+hidden(?=\s*>)/, '$1'));
}

await mkdir('dist/content', { recursive: true });
await copyFiles([
	'content/wiki-strings.pt.js',
	'content/wiki-projects.pt.js'
], 'dist/content');

await mkdir('dist/assets', { recursive: true });
await mkdir('dist/assets/icons', { recursive: true });
await mkdir('dist/assets/images', { recursive: true });

await copyFiles([
	'assets/images/geronimo-goty.webp',
	'assets/images/psp-larp-device.webp',
	'assets/images/ape.webp',
	'assets/images/archive.png',
	'assets/images/github-contributions.svg',
	'assets/images/hi.webp',
	'assets/images/me.webp',
	'assets/images/monke.webp'
], 'dist/assets/images');

await copyFiles([
	'assets/icons/aqua-scrollbar-arrows.png',
	'assets/icons/cv-txt.png',
	'assets/icons/drive.png',
	'assets/icons/ipod-classic.png',
	'assets/icons/ipod-genie-preview.svg',
	'assets/icons/logochrome.svg',
	'assets/icons/safari.png',
	'assets/icons/traffic-lights.svg'
], 'dist/assets/icons');

for (const directory of ['macos-10.6', 'cursors', 'login-buttons']) {
	await cp(`assets/icons/${directory}`, `dist/assets/icons/${directory}`, { recursive: true });
}

await cp('assets/images/wallpapers', 'dist/assets/images/wallpapers', { recursive: true });
await cp('assets/projects', 'dist/assets/projects', { recursive: true });
await cp('music', 'dist/music', { recursive: true });
console.log('Static site built in dist/');
