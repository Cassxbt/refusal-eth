/// Asserted gate tests — every branch of the frozen order + boundary rules.
/// Run: `tsx test/gate.test.ts`. Exit non-zero on first failure.
import assert from "node:assert";
import { evaluatePolicyInEnclave as gate } from "../src/workflow.ts";

const ALLOW = ["0x000000000000000000000000000000000000dEaD"];
const OTHER = "0x1111111111111111111111111111111111111111";
const policy = { dailyLimitUSDC: 10, perTxLimitUSDC: 5, allowlist: ALLOW, spentTodayUSDC: 0 };
const F = "demo.alice.refusal.eth";

let n = 0;
function check(name: string, cond: boolean) {
  n += 1;
  assert.ok(cond, `FAIL: ${name}`);
  console.log(`ok ${n} - ${name}`);
}

// ALLOW happy path
check("allowlisted under limit → ALLOW", gate({ fromENS: F, to: ALLOW[0], amountUSDC: 2, revoked: false }, policy).decision === "ALLOW");
// Boundary: amount == perTxLimit is ALLOW (strict >)
check("amount == perTxLimit → ALLOW", gate({ fromENS: F, to: ALLOW[0], amountUSDC: 5, revoked: false }, policy).decision === "ALLOW");
// REF-02 per-tx
check("allowlisted over perTx → REF-02", gate({ fromENS: F, to: ALLOW[0], amountUSDC: 1000, revoked: false }, policy).reasonCode === "REF-02 SEALED_LIMIT_BREACH");
// REF-02 daily (under perTx, over daily)
check("under perTx but over daily → REF-02", gate({ fromENS: F, to: ALLOW[0], amountUSDC: 4, revoked: false }, { ...policy, spentTodayUSDC: 8 }).reasonCode === "REF-02 SEALED_LIMIT_BREACH");
// REF-03 allowlist
check("non-allowlisted → REF-03", gate({ fromENS: F, to: OTHER, amountUSDC: 1, revoked: false }, policy).reasonCode === "REF-03 ALLOWLIST_MISS");
// Order: allowlist before limits (non-allowlisted + over-limit → REF-03, not REF-02)
check("non-allowlisted + over-limit → REF-03 (order)", gate({ fromENS: F, to: OTHER, amountUSDC: 1000, revoked: false }, policy).reasonCode === "REF-03 ALLOWLIST_MISS");
// REF-01 revoked, and order (revoked + non-allowlisted → REF-01)
check("revoked → REF-01", gate({ fromENS: F, to: ALLOW[0], amountUSDC: 2, revoked: true }, policy).reasonCode === "REF-01 REVOKED_NAME");
check("revoked + non-allowlisted → REF-01 (order)", gate({ fromENS: F, to: OTHER, amountUSDC: 1000, revoked: true }, policy).reasonCode === "REF-01 REVOKED_NAME");
// Case-insensitive allowlist
check("allowlist case-insensitive", gate({ fromENS: F, to: ALLOW[0].toUpperCase(), amountUSDC: 2, revoked: false }, policy).decision === "ALLOW");
// Zero/negative amounts still evaluate (route validates; gate is total)
check("zero amount allowlisted → ALLOW", gate({ fromENS: F, to: ALLOW[0], amountUSDC: 0, revoked: false }, policy).decision === "ALLOW");

console.log(`\nPASS: ${n} gate asserts`);
