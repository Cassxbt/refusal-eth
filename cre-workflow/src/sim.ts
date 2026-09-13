import { evaluatePolicyInEnclave } from "./workflow.ts";

// Local gate fixture — real `cre workflow simulate` transcript lands in evidence/.
const policy = {
  dailyLimitUSDC: 10,
  perTxLimitUSDC: 5,
  allowlist: ["0x000000000000000000000000000000000000dEaD"],
  spentTodayUSDC: 0,
};

const cases = [
  { fromENS: "demo.alice.refusal.eth", to: "0x000000000000000000000000000000000000dEaD", amountUSDC: 2, revoked: false },
  { fromENS: "demo.alice.refusal.eth", to: "0x000000000000000000000000000000000000dEaD", amountUSDC: 1000, revoked: false },
  { fromENS: "demo.alice.refusal.eth", to: "0x1111111111111111111111111111111111111111", amountUSDC: 1, revoked: false },
  { fromENS: "demo.alice.refusal.eth", to: "0x000000000000000000000000000000000000dEaD", amountUSDC: 2, revoked: true },
];

for (const c of cases) console.log(JSON.stringify({ intent: c, ...evaluatePolicyInEnclave(c, policy) }));
