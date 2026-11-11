import { randomBytes } from 'node:crypto';
import { hashPassword } from '../admin-server.mjs';

const password = randomBytes(24).toString('base64url');
console.log('Save this password in your password manager:', password);
console.log('Set MAIA_ADMIN_PASSWORD_HASH on the server to:', await hashPassword(password));
