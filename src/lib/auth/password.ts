import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const HASH_VERSION = "scrypt-v1";
const COST = 32_768;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;
const KEY_LENGTH = 64;
const MAX_MEMORY = 64 * 1024 * 1024;

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      KEY_LENGTH,
      {
        N: COST,
        r: BLOCK_SIZE,
        p: PARALLELIZATION,
        maxmem: MAX_MEMORY,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey);
      },
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await deriveKey(password, salt);

  return [
    HASH_VERSION,
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
    salt.toString("base64url"),
    derivedKey.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const [version, cost, blockSize, parallelization, encodedSalt, encodedKey] =
    encodedHash.split("$");

  if (
    version !== HASH_VERSION ||
    Number(cost) !== COST ||
    Number(blockSize) !== BLOCK_SIZE ||
    Number(parallelization) !== PARALLELIZATION ||
    !encodedSalt ||
    !encodedKey
  ) {
    return false;
  }

  try {
    const storedKey = Buffer.from(encodedKey, "base64url");
    if (storedKey.length !== KEY_LENGTH) {
      return false;
    }

    const derivedKey = await deriveKey(password, Buffer.from(encodedSalt, "base64url"));
    return timingSafeEqual(storedKey, derivedKey);
  } catch {
    return false;
  }
}
