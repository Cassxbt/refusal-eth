/// TODO — Privy adapter skeleton. Implements Signer via @privy-io/node 0.34.0:
/// wallets().create({ chain_type: 'ethereum', policy_ids, owner_id: quorumId })
/// → policies().create (Sepolia-only + per-tx cap) → keyQuorums().create (human gate,
/// REF-04 on timeout) → intents().rpc for ALLOW-over-threshold human approval.
/// No secrets in repo. Funded Sepolia wallet + policy/quorum IDs land in evidence/.
import type { Signer, SignRequest, SignResult } from "./types.ts";

export const privySigner: Signer = {
  kind: "privy",
  async sign(_req: SignRequest): Promise<SignResult> {
    throw new Error("TODO: wire @privy-io/node (see evidence/prize-eligibility.md + Privy verification)");
  },
};
