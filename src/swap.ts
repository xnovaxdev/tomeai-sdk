import * as anchor from "@anchor-lang/core";
import type { TomeWallet } from "./types";
import { DEFAULT_SLIPPAGE_BPS } from "./constants";

const { VersionedTransaction, Transaction, TransactionInstruction, PublicKey } = anchor.web3;

/** Base64 → bytes that works in both browser and Node (no Buffer dependency). */
function b64ToBytes(b64: string): Uint8Array {
  if (typeof atob === "function") {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Uint8Array((globalThis as any).Buffer.from(b64, "base64"));
}

/** A Jupiter quote response. Pass it verbatim to `buildSwapTx`. */
export interface SwapQuote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold?: string;
  priceImpactPct?: string;
  [k: string]: unknown;
}

/**
 * GET Jupiter `/quote` — how many `outputMint` units come out for `amountRaw`
 * of `inputMint`. The whole object is passed back to `buildSwapTx`.
 */
export async function getSwapQuote(
  jupiterUrl: string,
  inputMint: string,
  outputMint: string,
  amountRaw: string | number,
  slippageBps: number = DEFAULT_SLIPPAGE_BPS
): Promise<SwapQuote> {
  const url =
    `${jupiterUrl}/quote?inputMint=${inputMint}&outputMint=${outputMint}` +
    `&amount=${amountRaw}&slippageBps=${slippageBps}&restrictIntermediateTokens=true`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`jupiter /quote -> ${res.status} ${await res.text()}`);
  return res.json();
}

/** POST Jupiter `/swap` — build an UNSIGNED VersionedTransaction (base64) from a quote. */
export async function buildSwapTx(
  jupiterUrl: string,
  quote: SwapQuote,
  userPublicKey: string
): Promise<{ swapTransaction: string; lastValidBlockHeight?: number }> {
  const res = await fetch(`${jupiterUrl}/swap`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey,
      wrapAndUnwrapSol: true, // SOL is wrapped/unwrapped automatically
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: {
        priorityLevelWithMaxLamports: { maxLamports: 2_000_000, priorityLevel: "high" },
      },
    }),
  });
  if (!res.ok) throw new Error(`jupiter /swap -> ${res.status} ${await res.text()}`);
  return res.json();
}

/**
 * Execute a swap end-to-end via Jupiter: quote → build the tx → sign with the
 * wallet → send → confirm. Works the same in the browser and in Node. Returns
 * the tx signature.
 */
export async function executeSwap(
  jupiterUrl: string,
  connection: anchor.web3.Connection,
  wallet: TomeWallet,
  params: { inputMint: string; outputMint: string; amountRaw: string | number; slippageBps?: number }
): Promise<string> {
  const quote = await getSwapQuote(
    jupiterUrl,
    params.inputMint,
    params.outputMint,
    params.amountRaw,
    params.slippageBps ?? DEFAULT_SLIPPAGE_BPS
  );
  const { swapTransaction, lastValidBlockHeight } = await buildSwapTx(
    jupiterUrl,
    quote,
    wallet.publicKey.toBase58()
  );
  const tx = VersionedTransaction.deserialize(b64ToBytes(swapTransaction));
  const signed = await wallet.signTransaction(tx);
  const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false });
  const bh = await connection.getLatestBlockhash();
  await connection.confirmTransaction(
    {
      signature: sig,
      blockhash: bh.blockhash,
      lastValidBlockHeight: lastValidBlockHeight ?? bh.lastValidBlockHeight,
    },
    "confirmed"
  );
  return sig;
}

/** Plain SPL-token transfer (manual instruction — no @solana/spl-token dep). */
export async function transferToken(
  connection: anchor.web3.Connection,
  wallet: TomeWallet,
  opts: { source: anchor.web3.PublicKey; dest: anchor.web3.PublicKey; amount: number; tokenProgramId: string }
): Promise<string> {
  const data = new Uint8Array(9);
  data[0] = 3; // SPL Token "Transfer"
  new DataView(data.buffer).setBigUint64(1, BigInt(opts.amount), true);
  const ix = new TransactionInstruction({
    programId: new PublicKey(opts.tokenProgramId),
    keys: [
      { pubkey: opts.source, isSigner: false, isWritable: true },
      { pubkey: opts.dest, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
    ],
    data: data as unknown as Buffer,
  });
  const tx = new Transaction().add(ix);
  tx.feePayer = wallet.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const signed = await wallet.signTransaction(tx);
  const sig = await connection.sendRawTransaction(signed.serialize());
  const bh = await connection.getLatestBlockhash();
  await connection.confirmTransaction({ signature: sig, ...bh }, "confirmed");
  return sig;
}
