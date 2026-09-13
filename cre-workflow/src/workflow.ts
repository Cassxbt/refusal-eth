/// REFUSAL.eth CRE workflow — confidential policy evaluation.
/// Sensitive inputs (limits, allowlist) are processed inside the enclave via SDK `handlerInTee`.
/// Pure logic lives in `evaluatePolicyInEnclave`; SDK wiring lands next.

export type Decision = "ALLOW" | "REFUSE";
export type ReasonCode =
  | "REF-01 REVOKED_NAME"
  | "REF-02 SEALED_LIMIT_BREACH"
  | "REF-03 ALLOWLIST_MISS"
  | "REF-04 HUMAN_DENIED_TIMEOUT";

export interface SealedPolicy {
  dailyLimitUSDC: number;
  perTxLimitUSDC: number;
  allowlist: string[];
  spentTodayUSDC: number;
}

export interface Intent {
  fromENS: string;
  to: string;
  amountUSDC: number;
  revoked: boolean;
}

// evaluatePolicyInEnclave: pure gate logic that MUST run inside the enclave.
// SDK wiring TODO: wrap with @chainlink/cre-sdk `handlerInTee(trigger, onTrigger, ...)`
// + `runtime.getSecret()`. Do NOT export as `handlerInTee` (collides with SDK).
// Gate order (frozen): REVOKED → ALLOWLIST → PER-TX → DAILY.
// REF-04 HUMAN_DENIED_TIMEOUT is NOT an enclave verdict — it originates at the
// LOCK-SIGN stage (Privy quorum/human approval timeout). Kept in the ReasonCode
// union so receipts share one vocabulary across TEE + signer layers.
export function evaluatePolicyInEnclave(intent: Intent, policy: SealedPolicy): {
  decision: Decision;
  reasonCode: ReasonCode | "ALLOW";
} {
  // Fail closed on malformed numeric input. The API validates user input too,
  // but the enclave boundary must not rely on an upstream caller doing so.
  if (
    typeof intent.to !== "string" ||
    !Number.isFinite(intent.amountUSDC) ||
    intent.amountUSDC < 0 ||
    !Number.isFinite(policy.dailyLimitUSDC) ||
    policy.dailyLimitUSDC < 0 ||
    !Number.isFinite(policy.perTxLimitUSDC) ||
    policy.perTxLimitUSDC < 0 ||
    !Number.isFinite(policy.spentTodayUSDC) ||
    policy.spentTodayUSDC < 0 ||
    !Array.isArray(policy.allowlist)
  ) {
    return { decision: "REFUSE", reasonCode: "REF-02 SEALED_LIMIT_BREACH" };
  }
  if (intent.revoked) return { decision: "REFUSE", reasonCode: "REF-01 REVOKED_NAME" };
  if (!policy.allowlist.map((a) => a.toLowerCase()).includes(intent.to.toLowerCase()))
    return { decision: "REFUSE", reasonCode: "REF-03 ALLOWLIST_MISS" };
  if (intent.amountUSDC > policy.perTxLimitUSDC)
    return { decision: "REFUSE", reasonCode: "REF-02 SEALED_LIMIT_BREACH" };
  if (policy.spentTodayUSDC + intent.amountUSDC > policy.dailyLimitUSDC)
    return { decision: "REFUSE", reasonCode: "REF-02 SEALED_LIMIT_BREACH" };
  return { decision: "ALLOW", reasonCode: "ALLOW" };
}
