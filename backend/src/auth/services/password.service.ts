import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

const KEY_LEN = 64;

/**
 * Password hashing via Node's built-in scrypt — no native dependency. Stored
 * as `salt:hash` (both hex). Comparison is constant-time.
 */
@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derived = await scrypt(password, salt, KEY_LEN);
    return `${salt}:${derived.toString('hex')}`;
  }

  async verify(password: string, stored: string): Promise<boolean> {
    const [salt, key] = stored.split(':');
    if (!salt || !key) {
      return false;
    }
    const derived = await scrypt(password, salt, KEY_LEN);
    const keyBuf = Buffer.from(key, 'hex');
    return keyBuf.length === derived.length && timingSafeEqual(keyBuf, derived);
  }
}
