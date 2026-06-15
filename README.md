<div align="center">

<h1>Tome&nbsp;AI&nbsp;SDK</h1>

<p>CA: <code>E7hFN5SJNLutNSuDnf4raV1yiM7qrrrHjUCevR8qpump</code></p>

<p><strong>Decentralized, wallet-owned memory for AI agents on Solana.<br/>Store, recall, share, fork, and trade agent memory — one class for agents and apps.</strong></p>

<p>
  <a href="https://www.npmjs.com/package/@tome_ai/sdk"><img src="https://img.shields.io/npm/v/@tome_ai/sdk?style=flat-square&color=CB3837&label=npm&logo=npm&logoColor=white" alt="npm version"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="license"></a>
  <img src="https://img.shields.io/badge/node-%3E%3D18-3C873A?style=flat-square&logo=node.js&logoColor=white" alt="node >=18">
  <img src="https://img.shields.io/badge/Solana-mainnet--beta-9945FF?style=flat-square&logo=solana&logoColor=white" alt="solana">
  <img src="https://img.shields.io/badge/swaps-Jupiter-22D1A8?style=flat-square" alt="jupiter">
  <img src="https://img.shields.io/badge/types-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="typescript">
</p>

<p>
  <a href="https://github.com/xnovaxdev/tomeai-sdk"><img src="https://img.shields.io/badge/GitHub-View_source-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"></a>
  &nbsp;
  <a href="https://www.npmjs.com/package/@tome_ai/sdk"><img src="https://img.shields.io/badge/npm-Install-CB3837?style=for-the-badge&logo=npm&logoColor=white" alt="npm"></a>
  &nbsp;
  <a href="https://jup.ag"><img src="https://img.shields.io/badge/Powered_by-Jupiter-22D1A8?style=for-the-badge&logoColor=white" alt="Jupiter"></a>
</p>

</div>

---

Tome gives every AI agent a portable, **wallet-owned memory vault** on Solana.
Content lives off-chain through the Tome backend; the chain holds a Merkle root
and a storage pointer, so memory is **verifiable** and **owned by the agent's
wallet** — not a centralized SaaS. Agents can keep memory private, share it, fork
it, or **sell access** on the marketplace.

This SDK is the thin client. One `TomeAI` class works for both **agents**
(a server keypair) and **apps** (a browser wallet adapter).

## Contents

- [Why](#why)
- [Install](#install)
- [Quick start](#quick-start)
- [Memory types](#memory-types)
- [API](#api)
- [Marketplace &amp; payments](#marketplace--payments)
- [Wallets](#wallets)
- [Configuration](#configuration)
- [Requirements](#requirements)
- [License](#license)

## Why

- **Wallet-owned** — vaults are PDAs derived from the agent's wallet. No vendor
  lock-in; memory is portable and sovereign.
- **Verifiable** — every write commits a Merkle root on-chain, so content can be
  cryptographically verified against the chain.
- **Composable** — share access with another wallet, or **fork** a vault to build
  on someone else's knowledge.
- **Monetizable** — list a vault on the marketplace. Buyers pay in **$TOMEAI**;
  paying in SOL auto-swaps to $TOMEAI through **Jupiter** first, so settlement
  always lands in the token.

## Install

```bash
npm install @tome_ai/sdk
```

## Quick start

```ts
import { TomeAI, walletFromKeypair } from '@tome_ai/sdk';
import * as anchor from '@anchor-lang/core';

// `connect()` pulls the program id + $TOMEAI mint from the backend (GET /api/config),
// so you don't hardcode them. Pass `programId` / `tokenMint` explicitly to override.
const tome = await TomeAI.connect({
    apiUrl: 'https://your-tome-backend',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    wallet: walletFromKeypair(myKeypair), // server/bot — or a browser wallet adapter
});

// Create a vault and store memory
const vault = await tome.createVault('defi-knowledge', {
    visibility: 'public',
});
await tome.remember(vault, {
    type: 'semantic',
    content: 'Jupiter routes through 14 DEXs',
});

// Recall it
const hits = await tome.recall(vault, 'best DEX route');

// Sell access on the marketplace (price in SOL, settled in $TOMEAI)
await tome.list(vault, { priceSol: 0.05, previewCount: 1, category: 'deFi' });
```

In the browser, pass a wallet-adapter instead of a keypair:

```ts
import { useWallet } from '@solana/wallet-adapter-react';

const wallet = useWallet();
const tome = await TomeAI.connect({ apiUrl, wallet });
```

> `TomeAI.connect()` fetches the deployment config (program id, token mint) from
> the backend so nothing is hardcoded. Prefer it; `new TomeAI(cfg)` is still
> available when you want to pass everything yourself.

## Memory types

| Type         | Use for                         |
| ------------ | ------------------------------- |
| `episodic`   | time-stamped events             |
| `semantic`   | extracted facts                 |
| `procedural` | how-to / step-by-step knowledge |

## API

```ts
const tome = new TomeAI(config);
```

| Method                                                         | Description                                                                                  |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `TomeAI.connect(cfg)` _(static)_                               | Recommended: fetch program id + token mint from the backend, then build the client.          |
| `getConfig()`                                                  | The deployment config the backend advertises (program id, mint, decimals, ticker, cluster).  |
| `createVault(name, opts)`                                      | Register the agent (idempotent) + create a vault. Returns its address.                       |
| `remember(vault, entry)`                                       | Store content off-chain and commit the new Merkle root on-chain.                             |
| `recall(vault, query)`                                         | Keyword/tag search over a vault's entries (full content if you have access).                 |
| `readEntries(vault)`                                           | Read every entry you have access to (owner, open vault, or a paid grant).                    |
| `list(vault, opts)` / `unlist(vault)`                          | Create / update / remove a marketplace listing.                                              |
| `buyAccessToken(vault, opts)`                                  | Buy full access, paying directly in **$TOMEAI**.                                             |
| `buyWithSol(vault, opts)`                                      | Buy full access paying in **SOL** — auto-swaps to $TOMEAI via Jupiter, then pays the seller. |
| `checkAccess(vault)`                                           | Does the connected wallet already have full access? (no signature)                           |
| `grantAccess(vault, grantee)` / `revokeAccess(vault, grantee)` | Share / revoke read access with another wallet.                                              |
| `forget(vault)`                                                | Close the vault on-chain.                                                                    |

Every method is fully typed; shared shapes (`TomeConfig`, `TomeWallet`, `Hit`,
`MemoryInput`, …) are exported from the package.

## Marketplace & payments

Listings are priced in **SOL**, but settlement always lands in **$TOMEAI** — so
demand for access creates buy pressure on the token.

- **Pay in token** — `buyAccessToken` transfers $TOMEAI straight to the seller.
- **Pay in SOL** — `buyWithSol` swaps exactly the sticker SOL → $TOMEAI through
  **Jupiter**, then pays the seller the full swap output (the buyer spends exactly
  the listed SOL; no slippage edge cases).

Swaps use the public Jupiter Swap API by default. Override the endpoint (e.g. a
paid Jupiter tier) via `jupiterUrl`.

```ts
await tome.buyWithSol(vault, { seller, priceSol: 0.05 }); // SOL → $TOMEAI → seller
await tome.buyAccessToken(vault, { mint, seller, amount }); // pay in $TOMEAI
```

## Wallets

`TomeWallet` is satisfied by:

- a **browser wallet adapter** (`useWallet()` from `@solana/wallet-adapter-react`), or
- **`walletFromKeypair(keypair)`** for servers, bots, and CI.

```ts
import { walletFromKeypair } from '@tome_ai/sdk';
const wallet = walletFromKeypair(myKeypair);
```

## Configuration

```ts
new TomeAI({
  apiUrl,            // required — Tome backend base URL
  wallet,            // required — wallet adapter or walletFromKeypair()
  rpcUrl?,           // RPC endpoint (or pass `connection`)
  connection?,       // an existing web3 Connection (overrides rpcUrl)
  programId?,        // Tome program id (defaults to the published one)
  tokenMint?,        // $TOMEAI mint — required for SOL→token payments
  jupiterUrl?,       // Jupiter Swap API base (defaults to the public lite-api)
  slippageBps?,      // default swap slippage in bps (100 = 1%)
});
```

## Requirements

- **Node.js >= 18** (a global `fetch`) for server/agent usage, or any modern
  browser for app usage.
- A running **Tome backend** (the off-chain content + search service) that the
  SDK talks to via `apiUrl`.

## License

[MIT](./LICENSE) © xnovaxdev
