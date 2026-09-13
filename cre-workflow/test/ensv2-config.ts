import assert from "node:assert/strict";
import { canonicalEnsName, canonicalEnsNode, readEnsV2Config } from "../../web/lib/ensv2.ts";

assert.equal(canonicalEnsName(" Alice.ETH "), "alice.eth");
assert.equal(canonicalEnsNode("Alice.eth"), canonicalEnsNode("alice.eth"));
assert.equal(canonicalEnsName("not a name"), null);
assert.equal(canonicalEnsNode(""), null);

const valid = readEnsV2Config({
  ENSV2_CHAIN_ID: "11155111",
  ENSV2_REGISTRY: "0x0000000000000000000000000000000000000001",
  ENSV2_RESOLVER: "0x0000000000000000000000000000000000000002",
  ENSV2_UNIVERSAL_RESOLVER: "0x0000000000000000000000000000000000000003",
});
assert.equal(valid?.chainId, 11155111);
assert.equal(readEnsV2Config({ ENSV2_CHAIN_ID: "1" }), null);
assert.equal(readEnsV2Config({ ENSV2_CHAIN_ID: "11155111", ENSV2_REGISTRY: "bad" }), null);
console.log("PASS: ENSv2 canonical identity and fail-closed config");
