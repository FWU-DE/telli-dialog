import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

export function encrypt({
  text,
  plainEncryptionKey,
}: {
  text: string;
  plainEncryptionKey: string;
}): string {
  const key = crypto.createHash('sha256').update(String(plainEncryptionKey)).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encryptedBuffer = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

  return iv.toString('hex') + ':' + encryptedBuffer.toString('hex');
}

export function decrypt({
  data,
  plainEncryptionKey,
}: {
  data: string;
  plainEncryptionKey: string;
}): string {
  const key = crypto.createHash('sha256').update(String(plainEncryptionKey)).digest();
  const [ivHex, encryptedTextHex] = data.split(':');

  if (ivHex === undefined || encryptedTextHex === undefined) {
    throw Error('Could not decrypt data');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const encryptedText = Buffer.from(encryptedTextHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  const decryptedBuffer = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decryptedBuffer.toString('utf8');
}

export function decryptMaybeValue({
  data,
  plainEncryptionKey,
}: {
  data: string | null | undefined;
  plainEncryptionKey: string;
}) {
  if (data === null || data === undefined) {
    return null;
  }

  return decrypt({ data, plainEncryptionKey });
}
