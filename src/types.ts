import type * as anchor from "@anchor-lang/core";

export type Visibility = "public" | "permissioned" | "private";
export type MemoryType = "episodic" | "semantic" | "procedural";
export type Permission = "read" | "write" | "admin";

/**
 * Minimal signer the SDK needs. Satisfied by BOTH:
 *  - a browser wallet adapter (`useWallet()`), and
 *  - a server keypair via `walletFromKeypair()`.
 */
export interface TomeWallet {
  publicKey: anchor.web3.PublicKey;
  signTransaction<T extends anchor.web3.Transaction | anchor.web3.VersionedTransaction>(
    tx: T
  ): Promise<T>;
  signAllTransactions<T extends anchor.web3.Transaction | anchor.web3.VersionedTransaction>(
    txs: T[]
  ): Promise<T[]>;
  /** Required only for `remember` (SIWS auth against the backend). */
  signMessage?(message: Uint8Array): Promise<Uint8Array>;
}

export interface TomeConfig {
  /** Base URL of the Tome backend (e.g. http://localhost:3000). */
  apiUrl: string;
  /** Signer (wallet adapter or keypair-wrapped). */
  wallet: TomeWallet;
  /** RPC endpoint (defaults to devnet). Ignored if `connection` is given. */
  rpcUrl?: string;
  connection?: anchor.web3.Connection;
  programId?: string;
  /** Jupiter Swap API base URL (for SOL→token swaps). Defaults to the public lite-api. */
  jupiterUrl?: string;
  /** Token mint used for marketplace payments ($TOMEAI). Needed for SOL→token swaps. */
  tokenMint?: string;
  /** Default swap slippage tolerance in basis points (100 = 1%). */
  slippageBps?: number;
}

export interface MemoryInput {
  type: MemoryType;
  content: string;
  tags?: string[];
  confidence?: number;
  /** Show this entry in the vault's free marketplace preview. */
  isPreview?: boolean;
}

export interface Hit {
  id: string;
  type: string;
  content: string;
  confidence: number;
  tags: string[];
}

export type { Tome } from "./idl";
