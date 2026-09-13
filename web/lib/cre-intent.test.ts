import assert from "node:assert/strict";
import { parseCreIntent } from "./cre-intent.ts";

const valid = parseCreIntent({
  fromENS: " Alice.ETH ",
  to: "0x000000000000000000000000000000000000dEaD",
  amountUSDC: "2",
});
assert.deepEqual(valid, {
  fromENS: "alice.eth",
  to: "0x000000000000000000000000000000000000dEaD",
  amountUSDC: 2,
});

for (const input of [
  { fromENS: "not a name", to: valid?.to, amountUSDC: "1" },
  { fromENS: "alice.eth", to: "0x123", amountUSDC: "1" },
  { fromENS: "alice.eth", to: valid?.to, amountUSDC: "1e3" },
  { fromENS: "alice.eth", to: valid?.to, amountUSDC: 0 },
]) {
  assert.equal(parseCreIntent(input), null);
}

console.log("PASS: CRE intent adapter canonicalizes and validates inputs");
