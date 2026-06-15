/**
 * Client-side mirror of the protocol's integrity primitive. Lets an agent compute
 * a vault's Merkle root locally — no backend, no network — to trustlessly confirm
 * its content matches what's anchored on-chain, or to precompute the root before a
 * commit. The algorithm is identical to the backend and the on-chain program:
 * leaves = sha256(content), a binary tree that duplicates the last node on an odd
 * layer, and an empty set hashes to 32 zero bytes.
 *
 * Uses Web Crypto (`crypto.subtle`) — the same API the SDK already uses for
 * encryption — so it runs unchanged in both Node 18+ and the browser.
 */

const enc = new TextEncoder();

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest("SHA-256", data as BufferSource);
  return new Uint8Array(digest);
}

function toHex(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return s;
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

/** sha256(content) as hex — the content-addressed id of a memory entry. */
export async function entryHash(content: string): Promise<string> {
  return toHex(await sha256(enc.encode(content)));
}

/** Deterministic binary Merkle root over raw 32-byte leaves. Empty → 32 zero bytes. */
async function merkleRoot(leaves: Uint8Array[]): Promise<Uint8Array> {
  if (leaves.length === 0) return new Uint8Array(32);
  let layer = leaves;
  while (layer.length > 1) {
    const next: Uint8Array[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      const l = layer[i];
      const r = i + 1 < layer.length ? layer[i + 1] : layer[i]; // duplicate last if odd
      next.push(await sha256(concat(l, r)));
    }
    layer = next;
  }
  return layer[0];
}

/**
 * Merkle root (hex) over an ordered list of entry contents — the exact value the
 * vault commits on-chain. `contents` must be in the vault's stored order.
 */
export async function merkleRootHex(contents: string[]): Promise<string> {
  const leaves = await Promise.all(contents.map((c) => sha256(enc.encode(c))));
  return toHex(await merkleRoot(leaves));
}

/** Compute the root from entries (e.g. the result of `readEntries`/`recall`), in order. */
export async function computeVaultRoot(entries: { content: string }[]): Promise<string> {
  return merkleRootHex(entries.map((e) => e.content));
}
