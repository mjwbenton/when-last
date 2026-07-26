const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

function randString(len: number): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < len; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return out;
}

export function uid(prefix: string): string {
  return `${prefix}-${randString(6)}`;
}

export function generateBackupKey(): string {
  return `wl-${randString(4)}-${randString(4)}-${randString(4)}`;
}

export const BACKUP_KEY_PATTERN = /^wl-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/;
