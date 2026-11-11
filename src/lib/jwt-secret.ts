export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET must be configured in the environment.");
  }

  const encodedSecret = new TextEncoder().encode(secret);
  if (encodedSecret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 bytes long.");
  }

  return encodedSecret;
}
