/**
 * Client-side encryption for PRIVATE vaults. The content is encrypted in the
 * browser/bot before it ever reaches the backend, using a key derived from a
 * deterministic wallet signature (ed25519 sigs are deterministic, so the key is
 * stable across sessions). The backend only ever stores ciphertext for private
 * vaults — it cannot read the content. AES-256-GCM via WebCrypto (isomorphic).
 */
const KEY_MESSAGE = "Tome AI encryption key v1";
const ENC = "enc:1:";

const b64 = (b: Uint8Array): string => {
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s);
};
const fromB64 = (s: string): Uint8Array => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export const isEncrypted = (s: string): boolean => s.startsWith(ENC);

/** Derive a stable AES-GCM key from a wallet signature over a fixed message. */
export async function deriveKey(
  signMessage: (m: Uint8Array) => Promise<Uint8Array>
): Promise<CryptoKey> {
  const sig = await signMessage(new TextEncoder().encode(KEY_MESSAGE));
  const material = await crypto.subtle.digest("SHA-256", sig as BufferSource);
  return crypto.subtle.importKey("raw", material, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptWith(key: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(plaintext) as BufferSource;
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data));
  return ENC + b64(iv) + ":" + b64(ct);
}

export async function decryptWith(key: CryptoKey, blob: string): Promise<string> {
  if (!isEncrypted(blob)) return blob;
  const parts = blob.split(":"); // enc:1:<iv>:<ct>
  const iv = fromB64(parts[2]) as BufferSource;
  const ct = fromB64(parts[3]) as BufferSource;
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(pt);
}
