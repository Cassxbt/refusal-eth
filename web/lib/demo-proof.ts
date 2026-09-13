import { createHash } from "node:crypto";
import type { ProofReceipt } from "./store";
import { demoPolicy } from "./store";
import { evaluatePolicyInEnclave } from "./gate";

export const DEMO_ENS = "demo.alice.refusal.eth";
export const DEMO_ADDRESS = "0x000000000000000000000000000000000000a11c" as const;

const scenarios = [
  { to: "0x000000000000000000000000000000000000dEaD", amountUSDC: 2 },
  { to: "0x000000000000000000000000000000000000dEaD", amountUSDC: 1000 },
  { to: "0x1111111111111111111111111111111111111111", amountUSDC: 1 },
] as const;

function idFor(to: string, amountUSDC: number): string {
  const input = `${DEMO_ENS}|${to.toLowerCase()}|${amountUSDC}|sepolia`;
  return `proof_${createHash("sha256").update(input).digest("hex").slice(0, 32)}`;
}

export function demoProofForIntent(input: { fromENS: string; to: string; amountUSDC: number }): ProofReceipt | null {
  if (input.fromENS !== DEMO_ENS) return null;
  const scenario = scenarios.find((entry) => entry.to.toLowerCase() === input.to.toLowerCase() && entry.amountUSDC === input.amountUSDC);
  if (!scenario) return null;
  const { decision, reasonCode } = evaluatePolicyInEnclave(
    { fromENS: DEMO_ENS, to: scenario.to, amountUSDC: scenario.amountUSDC, revoked: false },
    demoPolicy(),
  );
  return {
    id: idFor(scenario.to, scenario.amountUSDC),
    agentENS: DEMO_ENS,
    intent: { to: scenario.to, amountUSDC: scenario.amountUSDC, chain: "sepolia" },
    decision,
    reasonCode,
    ensCheck: {
      address: DEMO_ADDRESS,
      resolver: null,
      revoked: false,
      role: "DEMO IDENTITY (synthetic — no ENS ownership implied)",
    },
    cre: { engine: "evaluatePolicyInEnclave (web mirror; CRE handlerInTee simulation evidenced separately)", simHash: null, verdictSig: null },
    signer: { kind: "none-yet (Privy adapter TODO)", human: "not-requested", signed: false, txHash: null },
    links: {
      ensSepolia: `https://sepolia.etherscan.io/enslookup-search?search=${encodeURIComponent(DEMO_ENS)}`,
      explorerTxOrNull: null,
    },
    ts: "2026-01-01T00:00:00.000Z",
  };
}

export function demoProofById(id: string): ProofReceipt | undefined {
  for (const scenario of scenarios) {
    const receipt = demoProofForIntent({ fromENS: DEMO_ENS, to: scenario.to, amountUSDC: scenario.amountUSDC });
    if (receipt?.id === id) return receipt;
  }
  return undefined;
}
