import assert from "node:assert/strict";
import { privySigner } from "./privy.ts";

const base = {
  agentENS: "demo.alice.refusal.eth",
  to: "0x000000000000000000000000000000000000dEaD",
  amountUSDC: 1,
  proofId: "proof_test",
  verdictSig: null,
  verdictVerified: false,
};

assert.deepEqual(await privySigner.sign(base), {
  signed: false,
  txHash: null,
  reasonCode: "REF-02 SEALED_LIMIT_BREACH",
  signer: "privy",
});

assert.deepEqual(await privySigner.sign({
  ...base,
  verdictSig: "opaque-test-only",
  verdictVerified: true,
}), {
  signed: false,
  txHash: null,
  reasonCode: "REF-04 HUMAN_DENIED_TIMEOUT",
  signer: "privy",
});

console.log("PASS: Privy signer refuses missing or unverified authorization");
