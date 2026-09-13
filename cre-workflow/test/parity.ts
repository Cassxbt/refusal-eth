/// Parity: web mirror must equal canonical gate on a 20-case matrix.
/// Run: `tsx test/parity.ts`. Any drift = non-zero exit (judge-path guarantee).
import assert from "node:assert";
import { evaluatePolicyInEnclave as canonical } from "../src/workflow.ts";
import { evaluatePolicyInEnclave as mirror } from "../../web/lib/gate.ts";

const ADD = ["0x000000000000000000000000000000000000dEaD", "0x2222222222222222222222222222222222222222"];
const OUT = "0x1111111111111111111111111111111111111111";
const base = { dailyLimitUSDC: 10, perTxLimitUSDC: 5, allowlist: ADD, spentTodayUSDC: 0 };

const amounts = [0, 1, 2, 5, 6, 10, 11, 1000];
const cases: { to: string; amountUSDC: number; revoked: boolean; spent: number }[] = [];
for (const a of amounts) {
  cases.push({ to: ADD[0], amountUSDC: a, revoked: false, spent: 0 });
  cases.push({ to: OUT, amountUSDC: a, revoked: false, spent: 0 });
}
cases.push({ to: ADD[0], amountUSDC: 2, revoked: true, spent: 0 });
cases.push({ to: OUT, amountUSDC: 1000, revoked: true, spent: 0 });
cases.push({ to: ADD[1], amountUSDC: 4, revoked: false, spent: 8 });
cases.push({ to: ADD[0], amountUSDC: 5, revoked: false, spent: 5 });

assert.ok(cases.length === 20, `matrix must be 20 cases, got ${cases.length}`);
let n = 0;
for (const c of cases) {
  const p = { ...base, spentTodayUSDC: c.spent };
  const a = canonical({ fromENS: "demo.alice.refusal.eth", to: c.to, amountUSDC: c.amountUSDC, revoked: c.revoked }, p);
  const b = mirror({ fromENS: "demo.alice.refusal.eth", to: c.to, amountUSDC: c.amountUSDC, revoked: c.revoked }, p);
  n += 1;
  assert.deepStrictEqual(b, a, `DRIFT case ${n}: ${JSON.stringify(c)} canonical=${JSON.stringify(a)} mirror=${JSON.stringify(b)}`);
}
console.log(`PASS: mirror == canonical on ${n}/20 cases`);
