/// INTERFACE ONLY — Ledger Key Ring adapter shape. NOT wired (no hardware for
/// `wallet-cli ring init`, device-required per Ledger docs). Production swap:
///
///   WALLET_PASS=$(security find-generic-password -a default -s ledger-wallet-cli -w) \
///     wallet-cli ring encrypt --key <key> -i secrets.txt -o secrets.enc
///
/// Never faked as a Ring tx. Demo uses privy/local. Not a selected prize track.
import type { Signer, SignRequest, SignResult } from "./types.ts";

export const ledgerRingSigner: Signer = {
  kind: "ledger-ring",
  async sign(_req: SignRequest): Promise<SignResult> {
    throw new Error("No hardware: wallet-cli ring init requires a Ledger device (verified 2026-09-13)");
  },
};
