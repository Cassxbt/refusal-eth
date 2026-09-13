import type { Signer, SignRequest, SignResult } from "./types.ts";
import { executePrivySend } from "../web/lib/privy.ts";

export const privySigner: Signer = {
  kind: "privy",
  async sign(req: SignRequest): Promise<SignResult> {
    if (!req.verdictSig || !req.verdictVerified)
      return { signed: false, txHash: null, reasonCode: "REF-02 SEALED_LIMIT_BREACH", signer: "privy" };
    if (!req.userSignature)
      return { signed: false, txHash: null, reasonCode: "REF-04 HUMAN_DENIED_TIMEOUT", signer: "privy" };
    return executePrivySend({
      recipient: req.to,
      amountUSDC: req.amountUSDC,
      userSignature: req.userSignature,
      idempotencyKey: req.idempotencyKey ?? req.proofId,
    });
  },
};
