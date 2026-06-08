import * as anchor from "@anchor-lang/core";
import bs58 from "bs58";
import idl from "./idl.json";
import type { Tome } from "./idl";
import {
  DEFAULT_PROGRAM_ID,
  DEFAULT_RPC,
  SEEDS,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  WSOL_MINT,
  DEFAULT_JUPITER_URL,
  DEFAULT_SLIPPAGE_BPS,
} from "./constants";
import { executeSwap, transferToken } from "./swap";
import { deriveKey, encryptWith, decryptWith, isEncrypted } from "./crypto";
import type { TomeConfig, TomeWallet, Visibility, MemoryInput, Hit, Permission } from "./types";

const { PublicKey, Connection } = anchor.web3;
const enc = (s: string) => new TextEncoder().encode(s);

/** Associated token account address for (owner, mint). */
function ata(owner: anchor.web3.PublicKey, mint: anchor.web3.PublicKey): anchor.web3.PublicKey {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), new PublicKey(TOKEN_PROGRAM_ID).toBuffer(), mint.toBuffer()],
    new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ID)
  )[0];
}

async function sha256(input: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest("SHA-256", enc(input) as BufferSource);
  return new Uint8Array(digest);
}

/**
 * Tome AI client SDK. One class for humans and agents — pass a wallet adapter
 * (browser) or a keypair-wrapped wallet (`walletFromKeypair`, server/bot).
 *
 * On-chain actions are signed by the wallet; off-chain content + search go
 * through the Tome backend (`apiUrl`).
 */
export class TomeAI {
  readonly program: anchor.Program<Tome>;
  readonly wallet: TomeWallet;
  readonly programId: anchor.web3.PublicKey;
  private apiUrl: string;
  private token?: string;
  private jupiterUrl: string;
  private tokenMint?: string;
  private slippageBps: number;

  constructor(cfg: TomeConfig) {
    this.wallet = cfg.wallet;
    this.apiUrl = cfg.apiUrl.replace(/\/$/, "");
    this.jupiterUrl = (cfg.jupiterUrl || DEFAULT_JUPITER_URL).replace(/\/$/, "");
    this.tokenMint = cfg.tokenMint;
    this.slippageBps = cfg.slippageBps ?? DEFAULT_SLIPPAGE_BPS;
    this.programId = new PublicKey(cfg.programId || DEFAULT_PROGRAM_ID);
    const connection = cfg.connection ?? new Connection(cfg.rpcUrl || DEFAULT_RPC, "confirmed");
    const provider = new anchor.AnchorProvider(connection, cfg.wallet as never, {
      commitment: "confirmed",
    });
    // Anchor takes the program id from idl.address — override it so the configured
    // programId is the one actually invoked (the IDL bakes in the build-time id).
    const idlForId = { ...(idl as anchor.Idl), address: this.programId.toBase58() };
    this.program = new anchor.Program(idlForId, provider) as unknown as anchor.Program<Tome>;
    this.loadToken();
  }

  /**
   * Recommended entry point. Pulls the deployment config — **program id** and
   * **token mint** — from the Tome backend (`GET /api/config`), so callers don't
   * hardcode anything. Anything you pass in `cfg` overrides the backend; if the
   * backend is unreachable it falls back to `cfg` and then the SDK defaults.
   *
   * ```ts
   * const tome = await TomeAI.connect({ apiUrl, wallet });
   * ```
   */
  static async connect(cfg: TomeConfig): Promise<TomeAI> {
    const apiUrl = cfg.apiUrl.replace(/\/$/, "");
    let remote: { programId?: string; tokenMint?: string } = {};
    try {
      const res = await fetch(`${apiUrl}/api/config`);
      if (res.ok) remote = (await res.json()) as typeof remote;
    } catch {
      /* backend unreachable — fall back to cfg / SDK defaults */
    }
    return new TomeAI({
      ...cfg,
      programId: cfg.programId ?? remote.programId,
      tokenMint: cfg.tokenMint ?? remote.tokenMint,
    });
  }

  /** The deployment config the backend advertises (program id, token mint,
   *  decimals, ticker, cluster). */
  async getConfig(): Promise<{
    cluster?: string;
    programId?: string;
    tokenMint?: string;
    tokenTicker?: string;
    tokenDecimals?: number;
  }> {
    return this.get("/api/config").catch(() => ({}));
  }

  /** The token mint this client settles marketplace payments in, if known. */
  get mint(): string | undefined {
    return this.tokenMint;
  }

  get publicKey() {
    return this.wallet.publicKey;
  }

  // --- PDA helpers ---
  agentPda() {
    return PublicKey.findProgramAddressSync(
      [enc(SEEDS.agent), this.publicKey.toBuffer()],
      this.programId
    )[0];
  }
  vaultPda(nameHash: Uint8Array) {
    return PublicKey.findProgramAddressSync(
      [enc(SEEDS.vault), this.publicKey.toBuffer(), nameHash],
      this.programId
    )[0];
  }
  listingPda(vault: string | anchor.web3.PublicKey) {
    const v = typeof vault === "string" ? new PublicKey(vault) : vault;
    return PublicKey.findProgramAddressSync([enc(SEEDS.listing), v.toBuffer()], this.programId)[0];
  }

  private async reindex() {
    await fetch(`${this.apiUrl}/api/index`, { method: "POST" }).catch(() => {});
  }
  private async api(path: string, body: unknown, auth = false) {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (auth && this.token) headers.authorization = `Bearer ${this.token}`;
    const res = await fetch(`${this.apiUrl}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${path} -> ${res.status} ${await res.text()}`);
    return res.json();
  }

  private async get(path: string) {
    const res = await fetch(`${this.apiUrl}${path}`);
    if (!res.ok) throw new Error(`${path} -> ${res.status}`);
    return res.json();
  }

  // --- SIWS token persistence (browser): reuse the JWT across reloads so buyers
  // don't re-sign on every visit. No-op in Node (no localStorage). ---
  private tokenKey(): string {
    return `tome_jwt_${this.wallet.publicKey.toBase58()}`;
  }
  private loadToken(): void {
    if (typeof localStorage === "undefined") return;
    try {
      const t = localStorage.getItem(this.tokenKey());
      if (t && this.jwtValid(t)) this.token = t;
      else if (t) localStorage.removeItem(this.tokenKey());
    } catch {
      /* storage blocked — ignore */
    }
  }
  private saveToken(): void {
    if (typeof localStorage === "undefined" || !this.token) return;
    try {
      localStorage.setItem(this.tokenKey(), this.token);
    } catch {
      /* ignore */
    }
  }
  private jwtValid(t: string): boolean {
    try {
      const part = t.split(".")[1];
      const json = JSON.parse(
        typeof atob === "function"
          ? atob(part.replace(/-/g, "+").replace(/_/g, "/"))
          : // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (globalThis as any).Buffer.from(part, "base64").toString("utf8")
      );
      return !json.exp || json.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  // cached AES key for private-vault content (derived from a wallet signature)
  private _encKey?: Promise<CryptoKey>;
  private encKey(): Promise<CryptoKey> {
    if (!this.wallet.signMessage) throw new Error("wallet cannot signMessage (needed for private vaults)");
    return (this._encKey ??= deriveKey(this.wallet.signMessage.bind(this.wallet)));
  }

  /** Sign in with Solana (needed before `remember`). */
  async signIn(): Promise<void> {
    if (!this.wallet.signMessage) throw new Error("wallet cannot signMessage");
    const pubkey = this.publicKey.toBase58();
    const { message } = await this.api("/api/auth/nonce", { pubkey });
    const sig = await this.wallet.signMessage(enc(message));
    const { token } = await this.api("/api/auth/verify", { pubkey, signature: bs58.encode(sig) });
    this.token = token;
    this.saveToken();
  }

  /** Register the agent (idempotent). Skips the init tx if already registered —
   *  re-running it would fail simulation ("account already in use"), which wallets
   *  surface as a scary "transaction may fail" on the first signature. */
  async register(): Promise<void> {
    try {
      const existing = await this.program.provider.connection.getAccountInfo(this.agentPda());
      if (existing) return; // already registered — nothing to do
      await this.program.methods.registerAgent().accountsPartial({ owner: this.publicKey }).rpc();
    } catch {
      /* already registered or non-fatal — create_vault will surface a real error if needed */
    }
  }

  /** Create a vault; returns its address. */
  async createVault(
    name: string,
    opts: { description?: string; visibility?: Visibility; tags?: string[]; payFeeWith?: "token" | "sol" } = {}
  ): Promise<string> {
    // Quote the creation fee BEFORE creating (1st vault per wallet is free).
    const fee = (await this.get(`/api/creation-fee?owner=${this.publicKey.toBase58()}`).catch(() => ({
      needsFee: false,
    }))) as { needsFee: boolean; feeTokens: number; feeSol: number; treasuryAta: string; mint: string };

    await this.register();
    const nameHash = await sha256(name);
    const vault = this.vaultPda(nameHash);
    await this.program.methods
      .createVault(
        name,
        Array.from(nameHash),
        opts.description ?? "",
        { [opts.visibility ?? "public"]: {} },
        opts.tags ?? []
      )
      .accountsPartial({ vault, owner: this.publicKey })
      .rpc();
    await this.reindex();

    if (fee.needsFee) await this.payVaultFee(vault.toBase58(), fee, opts.payFeeWith ?? "token");
    return vault.toBase58();
  }

  /** Pay the vault-creation fee to the treasury (token, or SOL→swap→token). */
  async payVaultFee(
    vault: string,
    fee: { feeTokens: number; feeSol: number; treasuryAta: string; mint: string },
    payWith: "token" | "sol" = "token"
  ): Promise<void> {
    if (!this.token) await this.signIn();
    const conn = this.program.provider.connection;
    const mint = new PublicKey(fee.mint);
    let amount = fee.feeTokens;

    if (payWith === "sol") {
      const before = await this.tokenBalance(mint);
      await executeSwap(this.jupiterUrl, conn, this.wallet, {
        inputMint: WSOL_MINT,
        outputMint: fee.mint,
        amountRaw: Math.round(fee.feeSol * 1e9),
        slippageBps: this.slippageBps,
      });
      amount = (await this.tokenBalance(mint)) - before; // Variant 2: send the full swap output
      if (amount <= 0) throw new Error("swap produced no tokens for the fee");
    }

    const sig = await transferToken(conn, this.wallet, {
      source: ata(this.publicKey, mint),
      dest: new PublicKey(fee.treasuryAta),
      amount,
      tokenProgramId: TOKEN_PROGRAM_ID,
    });

    const res = await fetch(`${this.apiUrl}/api/vault/${vault}/fee`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${this.token}` },
      body: JSON.stringify({ sig }),
    });
    if (!res.ok) throw new Error(`fee verify -> ${res.status} ${await res.text()}`);
  }

  /**
   * Store a memory: off-chain content + on-chain merkle commit. For PRIVATE
   * vaults the content is encrypted client-side first — the backend only ever
   * sees ciphertext.
   */
  async remember(vault: string, entry: MemoryInput): Promise<void> {
    if (!this.token) await this.signIn();
    let content = entry.content;
    const vrow = await this.get(`/api/vault/${vault}`).catch(() => null);
    if (vrow?.visibility === "private") content = await encryptWith(await this.encKey(), content);
    const r = await this.api(`/api/vault/${vault}/remember`, { ...entry, content }, true);
    await this.program.methods
      .updateVault(null, null, null, r.storageRef, r.merkleRoot, r.entryCount)
      .accountsPartial({ vault: new PublicKey(vault), owner: this.publicKey })
      .rpc();
    await this.reindex();
  }

  /** Delete one entry: removes it off-chain and commits the new merkle on-chain. */
  async forgetEntry(vault: string, entryId: string): Promise<void> {
    if (!this.token) await this.signIn();
    const res = await fetch(`${this.apiUrl}/api/vault/${vault}/entry/${entryId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${this.token}` },
    });
    if (!res.ok) throw new Error(`forgetEntry -> ${res.status} ${await res.text()}`);
    const r = await res.json();
    await this.program.methods
      .updateVault(null, null, null, r.storageRef, r.merkleRoot, r.entryCount)
      .accountsPartial({ vault: new PublicKey(vault), owner: this.publicKey })
      .rpc();
    await this.reindex();
  }

  /** Owner: mark/unmark an entry as shown in the free marketplace preview. */
  async setPreview(vault: string, entryId: string, preview: boolean): Promise<void> {
    if (!this.token) await this.signIn();
    const res = await fetch(`${this.apiUrl}/api/vault/${vault}/entry/${entryId}/preview`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${this.token}` },
      body: JSON.stringify({ preview }),
    });
    if (!res.ok) throw new Error(`setPreview -> ${res.status} ${await res.text()}`);
  }

  private async maybeDecrypt(items: Hit[]): Promise<Hit[]> {
    if (this.wallet.signMessage && items.some((h) => isEncrypted(h.content))) {
      const key = await this.encKey().catch(() => null);
      if (key)
        for (const h of items)
          if (isEncrypted(h.content)) h.content = await decryptWith(key, h.content).catch(() => h.content);
    }
    return items;
  }

  /** Recall by keyword/tag search. Sends auth if signed in (full vs preview). */
  async recall(vault: string, query: string): Promise<Hit[]> {
    const hits: Hit[] = await this.api(`/api/vault/${vault}/search`, { query }, true);
    return this.maybeDecrypt(hits);
  }

  /**
   * Read all entries you have access to (owner or a paid grant). Signs in so the
   * backend can authorize you; returns the free preview otherwise.
   */
  async readEntries(vault: string): Promise<Hit[]> {
    if (this.wallet.signMessage && !this.token) await this.signIn().catch(() => {});
    const headers: Record<string, string> = {};
    if (this.token) headers.authorization = `Bearer ${this.token}`;
    const res = await fetch(`${this.apiUrl}/api/vault/${vault}/entries`, { headers });
    if (!res.ok) throw new Error(`entries -> ${res.status}`);
    return this.maybeDecrypt((await res.json()) as Hit[]);
  }

  /**
   * Does the connected wallet already have FULL access (owner / public / paid
   * grant)? Read-only, no signature — used by the UI to auto-reveal entries.
   */
  async checkAccess(vault: string): Promise<boolean> {
    const r = (await this.get(`/api/vault/${vault}/access?pubkey=${this.publicKey.toBase58()}`).catch(
      () => ({ access: false })
    )) as { access: boolean };
    return !!r.access;
  }

  /**
   * After a purchase, wait until the new grant is indexed so access is durable —
   * re-indexing between tries to beat RPC propagation lag. Returns the final state.
   */
  async confirmAccess(vault: string, tries = 8, delayMs = 1500): Promise<boolean> {
    for (let i = 0; i < tries; i++) {
      if (await this.checkAccess(vault)) return true;
      await this.reindex();
      await new Promise((r) => setTimeout(r, delayMs));
    }
    return this.checkAccess(vault);
  }

  /** Decrypt a private-vault content blob (owner only). Returns it unchanged if not encrypted. */
  async decrypt(blob: string): Promise<string> {
    if (!isEncrypted(blob)) return blob;
    return decryptWith(await this.encKey(), blob);
  }

  /** List (or re-list) a vault on the marketplace. `list_vault` inits the listing
   *  PDA, so re-listing an already-listed vault would fail simulation ("account
   *  already in use"). If a listing exists we close it first, then list with the
   *  new terms — so this is safe to call whether or not the vault is listed. */
  async list(
    vault: string,
    opts: { priceSol: number; previewCount?: number; category?: string }
  ): Promise<void> {
    const exists = await this.program.provider.connection.getAccountInfo(this.listingPda(vault));
    if (exists) await this.unlist(vault); // close the old listing so the re-init succeeds
    await this.program.methods
      .listVault(
        new anchor.BN(Math.round(opts.priceSol * 1e9)),
        opts.previewCount ?? 3,
        { [opts.category ?? "general"]: {} }
      )
      .accountsPartial({ vault: new PublicKey(vault), owner: this.publicKey })
      .rpc();
    await this.reindex();
  }

  async unlist(vault: string): Promise<void> {
    await this.program.methods
      .unlistVault()
      .accountsPartial({ vault: new PublicKey(vault), owner: this.publicKey })
      .rpc();
    await this.reindex();
  }

  /** Grant another wallet access. */
  async grantAccess(vault: string, grantee: string, permission: Permission = "read"): Promise<void> {
    await this.program.methods
      .grantAccess(new PublicKey(grantee), { [permission]: {} }, { free: {} }, new anchor.BN(0))
      .accountsPartial({ vault: new PublicKey(vault), owner: this.publicKey })
      .rpc();
    await this.reindex();
  }

  async revokeAccess(vault: string, grantee: string): Promise<void> {
    await this.program.methods
      .revokeAccess(new PublicKey(grantee))
      .accountsPartial({ vault: new PublicKey(vault), owner: this.publicKey })
      .rpc();
    await this.reindex();
  }

  /** Pay for and run a query against a listed vault (buyer side). */
  async query(
    vault: string,
    queryText: string,
    opts: { priceSol: number; seller: string }
  ): Promise<Hit[]> {
    await this.program.methods
      .marketplaceQuery(new anchor.BN(Math.round(opts.priceSol * 1e9)))
      .accountsPartial({
        vault: new PublicKey(vault),
        buyer: this.publicKey,
        seller: new PublicKey(opts.seller),
      })
      .rpc();
    return this.recall(vault, queryText);
  }

  /**
   * Pay for a query in SPL tokens (Model 2). `amount` is in token base units;
   * compute it from the price service: priceSol * tokensPerSol * 10**decimals.
   * Buyer and seller must already hold the token's associated account.
   */
  async queryToken(
    vault: string,
    queryText: string,
    opts: { mint: string; seller: string; amount: number }
  ): Promise<Hit[]> {
    const mint = new PublicKey(opts.mint);
    await this.program.methods
      .marketplaceQueryToken(new anchor.BN(opts.amount))
      .accountsPartial({
        vault: new PublicKey(vault),
        buyer: this.publicKey,
        buyerToken: ata(this.publicKey, mint),
        sellerToken: ata(new PublicKey(opts.seller), mint),
        tokenProgram: new PublicKey(TOKEN_PROGRAM_ID),
      })
      .rpc();
    return this.recall(vault, queryText);
  }

  /** Buy FULL access to a listed vault in SOL (pay seller + receive a paid grant). */
  async buyAccess(vault: string, opts: { priceSol: number; seller: string }): Promise<void> {
    await this.program.methods
      .buyAccess(new anchor.BN(Math.round(opts.priceSol * 1e9)))
      .accountsPartial({
        vault: new PublicKey(vault),
        buyer: this.publicKey,
        seller: new PublicKey(opts.seller),
      })
      .rpc();
    await this.reindex();
  }

  /** Buy FULL access to a listed vault in $TOME (`amount` in token base units). */
  async buyAccessToken(
    vault: string,
    opts: { mint: string; seller: string; amount: number }
  ): Promise<void> {
    const mint = new PublicKey(opts.mint);
    await this.program.methods
      .buyAccessToken(new anchor.BN(opts.amount))
      .accountsPartial({
        vault: new PublicKey(vault),
        buyer: this.publicKey,
        buyerToken: ata(this.publicKey, mint),
        sellerToken: ata(new PublicKey(opts.seller), mint),
        tokenProgram: new PublicKey(TOKEN_PROGRAM_ID),
      })
      .rpc();
    await this.reindex();
  }

  /** Raw token balance (base units) the wallet holds for `mint`. 0 if no account. */
  private async tokenBalance(mint: anchor.web3.PublicKey): Promise<number> {
    try {
      const res = await this.program.provider.connection.getTokenAccountBalance(ata(this.publicKey, mint));
      return Number(res.value.amount);
    } catch {
      return 0;
    }
  }

  /**
   * Buy FULL access paying with SOL (floating price). Swap EXACTLY `priceSol` to
   * the token and pay the seller the full swap output — so the buyer spends
   * exactly the sticker SOL and the seller receives the live SOL-equivalent
   * (minus the small swap fee). No fixed token target → no slippage edge cases.
   *
   * Two txs (swap, then pay). If the pay step fails the swapped tokens stay in
   * the wallet and are spendable — retry with `buyAccessToken` (no re-swap).
   */
  async buyWithSol(
    vault: string,
    opts: { seller: string; priceSol: number; slippageBps?: number }
  ): Promise<void> {
    const mintStr = this.tokenMint || ((await this.get("/api/price")) as { mint: string }).mint;
    const mint = new PublicKey(mintStr);
    const lamports = Math.round(opts.priceSol * 1e9);
    if (lamports <= 0) throw new Error("invalid price");

    const before = await this.tokenBalance(mint);
    await executeSwap(this.jupiterUrl, this.program.provider.connection, this.wallet, {
      inputMint: WSOL_MINT,
      outputMint: mintStr,
      amountRaw: lamports,
      slippageBps: opts.slippageBps ?? this.slippageBps,
    });
    const swapOut = (await this.tokenBalance(mint)) - before;
    if (swapOut <= 0) throw new Error("swap produced no tokens (try again, or pay in token)");

    await this.buyAccessToken(vault, { mint: mintStr, seller: opts.seller, amount: swapOut });
  }

  /** Close a vault. */
  async forget(vault: string): Promise<void> {
    await this.program.methods
      .deleteVault()
      .accountsPartial({ vault: new PublicKey(vault), owner: this.publicKey })
      .rpc();
    await this.reindex();
  }
}
