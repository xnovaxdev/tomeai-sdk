import * as anchor from "@anchor-lang/core";
import nacl from "tweetnacl";
import type { TomeWallet } from "./types";

/**
 * Wrap a Solana keypair as a TomeWallet — for server-side / bot usage where
 * there is no browser wallet adapter.
 */
export function walletFromKeypair(keypair: anchor.web3.Keypair): TomeWallet {
  const sign = <T extends anchor.web3.Transaction | anchor.web3.VersionedTransaction>(tx: T): T => {
    if ("version" in tx) (tx as anchor.web3.VersionedTransaction).sign([keypair]);
    else (tx as anchor.web3.Transaction).partialSign(keypair);
    return tx;
  };
  return {
    publicKey: keypair.publicKey,
    signTransaction: async (tx) => sign(tx),
    signAllTransactions: async (txs) => txs.map(sign),
    signMessage: async (message) => nacl.sign.detached(message, keypair.secretKey),
  };
}
