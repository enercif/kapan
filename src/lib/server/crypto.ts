import { env } from '$env/dynamic/private';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
	const keyHex = env.ENCRYPTION_KEY;
	if (!keyHex) throw new Error('ENCRYPTION_KEY is not set');
	const key = Buffer.from(keyHex, 'hex');
	if (key.length !== 32) throw new Error('ENCRYPTION_KEY must be 64 hex chars (32 bytes)');
	return key;
}

export function encrypt(text: string | undefined): string | null {
	if (!text) return null;
	const key = getKey();
	const iv = randomBytes(12);
	const cipher = createCipheriv(ALGORITHM, key, iv);
	const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
	const authTag = cipher.getAuthTag();
	return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(encoded: string | null): string {
	if (!encoded) return '';
	const key = getKey();
	const parts = encoded.split(':');
	if (parts.length !== 3) throw new Error('Invalid encrypted value format');
	const [ivHex, authTagHex, encryptedHex] = parts;
	const iv = Buffer.from(ivHex, 'hex');
	const authTag = Buffer.from(authTagHex, 'hex');
	const encrypted = Buffer.from(encryptedHex, 'hex');
	const decipher = createDecipheriv(ALGORITHM, key, iv);
	decipher.setAuthTag(authTag);
	return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
