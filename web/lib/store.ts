/// Proof store — file-backed (web/data/proofs/*.json) because Next.js bundles
/// each route separately: module-level Maps are NOT shared across routes,
/// and serverless instances don't share memory at all. Files survive both
/// in dev and on a single-host `next start` deploy. Production = KV/DB.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Decision, ReasonCode } from "./gate";

export interface ProofReceipt {
  id: string;
  agentENS: string;
  intent: { to: string; amountUSDC: number; chain: string };
  decision: Decision;
  reasonCode: ReasonCode | "ALLOW";
  ensCheck: { address: string | null; resolver: string | null; revoked: boolean; role: string };
  cre: { engine: string; simHash: string | null; verdictSig: string | null };
  signer: { kind: string; human: string; signed: boolean; txHash: string | null };
  links: { ensSepolia: string; explorerTxOrNull: string | null };
  ts: string;
}

const proofs = new Map<string, ProofReceipt>();
const revokedNames = new Set<string>();

function proofsDir(): string {
  const dir = join(process.cwd(), "data", "proofs");
  mkdirSync(dir, { recursive: true });
  return dir;
}

function safeId(id: string): boolean {
  return /^proof_[0-9a-f]+$/.test(id);
}

function revokedFile(): string {
  return join(proofsDir(), "_revoked.json");
}

function loadRevoked(): void {
  try {
    const raw = readFileSync(revokedFile(), "utf8");
    for (const n of JSON.parse(raw) as string[]) revokedNames.add(n);
  } catch {
    // first run — empty set
  }
}

let revokedLoaded = false;

export function isRevoked(name: string): boolean {
  if (!revokedLoaded) {
    loadRevoked();
    revokedLoaded = true;
  }
  return revokedNames.has(name.toLowerCase());
}

export function setRevoked(name: string, v: boolean): void {
  if (!revokedLoaded) {
    loadRevoked();
    revokedLoaded = true;
  }
  if (v) revokedNames.add(name.toLowerCase());
  else revokedNames.delete(name.toLowerCase());
  try {
    writeFileSync(revokedFile(), JSON.stringify([...revokedNames]));
  } catch {
    // memory set still serves this instance
  }
}

export function saveProof(r: ProofReceipt): void {
  proofs.set(r.id, r);
  try {
    writeFileSync(join(proofsDir(), `${r.id}.json`), JSON.stringify(r, null, 2));
  } catch {
    // memory cache still serves this instance
  }
}

export function getProof(id: string): ProofReceipt | undefined {
  const hit = proofs.get(id);
  if (hit) return hit;
  if (!safeId(id)) return undefined;
  try {
    const raw = readFileSync(join(proofsDir(), `${id}.json`), "utf8");
    const r = JSON.parse(raw) as ProofReceipt;
    proofs.set(id, r);
    return r;
  } catch {
    return undefined;
  }
}

export function newProofId(): string {
  return `proof_${Math.random().toString(16).slice(2, 6)}${Date.now().toString(16).slice(-4)}`;
}

/// DEMO sealed policy — constants until CRE Vault secrets land.
/// Limits intentionally small so the 4-min demo hits every branch.
export function demoPolicy() {
  return {
    dailyLimitUSDC: 10,
    perTxLimitUSDC: 5,
    allowlist: ["0x000000000000000000000000000000000000dEaD"],
    spentTodayUSDC: 0,
  };
}
