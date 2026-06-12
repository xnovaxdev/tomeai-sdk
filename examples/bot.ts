/**
 * Example: how an AI agent uses Tome from code (not the website).
 *
 * Needs a running Tome backend and a funded Solana keypair (JSON secret array).
 *   TOME_API=https://your-tome-backend \
 *   TOME_RPC=https://api.devnet.solana.com \
 *   KEYPAIR=./keypair.json \
 *   npx tsx examples/bot.ts
 */
import { readFileSync } from "fs";
import * as anchor from "@anchor-lang/core";
import { TomeAI, walletFromKeypair } from "../src/index";

async function main() {
  const keypairPath = process.env.KEYPAIR;
  if (!keypairPath) throw new Error("set KEYPAIR=/path/to/keypair.json (a JSON secret-key array)");
  const keypair = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(readFileSync(keypairPath, "utf8")))
  );

  const tome = new TomeAI({
    rpcUrl: process.env.TOME_RPC || "https://api.devnet.solana.com",
    apiUrl: process.env.TOME_API || "http://localhost:4000",
    wallet: walletFromKeypair(keypair),
  });
  console.log("agent:", tome.publicKey.toBase58());

  const name = `agent-mem-${Date.now()}`;
  const vault = await tome.createVault(name, { description: "agent working memory", visibility: "public", tags: ["agent"] });
  console.log("created vault:", vault);

  await tome.remember(vault, { type: "semantic", content: "Jupiter aggregator routes through 14 DEXs on Solana", tags: ["jupiter"] });
  await tome.remember(vault, { type: "procedural", content: "Bridge USDC ETH->SOL: Wormhole, approve, wait 15 min, redeem", tags: ["bridge"] });
  console.log("stored 2 memories");

  const hits = await tome.recall(vault, "jupiter");
  console.log(`recall('jupiter') -> ${hits.length} hit(s):`, hits[0]?.content);

  await tome.list(vault, { priceSol: 0.01, previewCount: 1, category: "deFi" });
  console.log("listed on marketplace");

  await tome.unlist(vault);
  await tome.forget(vault);
  console.log("cleaned up");

  if (hits.length < 1) throw new Error("recall returned no hits");
  console.log("\n✓ example OK");
}

main().then(() => process.exit(0)).catch((e) => {
  console.error("example failed:", e);
  process.exit(1);
});
