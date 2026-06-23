import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';

export function sha256Hex(value) {
  return createHash('sha256').update(String(value), 'utf8').digest('hex');
}

export function hashBuffer(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

export async function hashFile(filePath) {
  const hash = createHash('sha256');
  await new Promise((resolve, reject) => {
    const stream = createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', resolve);
  });
  return hash.digest('hex');
}

export function shortHash(hashValue, length = 16) {
  return String(hashValue).slice(0, length);
}
