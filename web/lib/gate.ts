/// Web mirror of ../../cre-workflow/src/workflow.ts `evaluatePolicyInEnclave`.
/// The canonical CRE handler lives in `cre-workflow/tee/workflow.ts`; this
/// mirror keeps the interactive proof API runnable without a CRE runtime.
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

// Gate order (frozen): REVOKED → ALLOWLIST → PER-TX → DAILY.
export function evaluatePolicyInEnclave(
  intent: Intent,
  policy: SealedPolicy,
): { decision: Decision; reasonCode: ReasonCode | "ALLOW" } {
  // Keep the mirror fail-closed with the CRE logic at the enclave boundary.
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
    !Array.isArray(policy.allowlist) ||
    policy.allowlist.some((entry) => typeof entry !== "string") ||
    typeof intent.fromENS !== "string" ||
    typeof intent.revoked !== "boolean"
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
