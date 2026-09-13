/// DEMO ONLY — ephemeral local signer for offline gate tests.
/// Never presented as hardware or TEE-backed. Production path is signer/privy.ts.
import type { Signer, SignRequest, SignResult } from "./types.ts";

export const localSigner: Signer = {
  kind: "local-ephemeral",
  async sign(req: SignRequest): Promise<SignResult> {
    if (!req.verdictSig)
      return { signed: false, txHash: null, reasonCode: "REF-02 SEALED_LIMIT_BREACH", signer: "local-ephemeral" };
    return { signed: true, txHash: null, reasonCode: "ALLOW", signer: "local-ephemeral" };
  },
};
