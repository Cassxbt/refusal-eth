import assert from "node:assert/strict";
import { buildPrivySendRequest, buildPrivyUsdcTransferRequest, executePrivySend, privyConfigPresent } from "./privy.ts";

const env = {
  PRIVY_APP_ID: "app-id",
  PRIVY_APP_SECRET: "app-secret",
  PRIVY_WALLET_ID: "wallet-id",
  PRIVY_SERVER_AUTHORIZATION_PRIVATE_KEY: "server-key",
};

assert.equal(privyConfigPresent(env), true);
assert.equal(privyConfigPresent({ PRIVY_APP_ID: "app-id" }), false);

const request = buildPrivySendRequest({
  appId: "app-id",
  walletId: "wallet-id",
  to: "0x000000000000000000000000000000000000dEaD",
  valueWei: "0x01",
  idempotencyKey: "refusal-test-000000000000000000000000",
  requestExpiry: Date.now() + 60_000,
});
assert.equal(request?.body.caip2, "eip155:11155111");
assert.equal(request?.body.method, "eth_sendTransaction");
assert.equal(request?.body.params.transaction.to, "0x000000000000000000000000000000000000dEaD");
assert.equal(buildPrivySendRequest({ ...requestInput(), to: "0x1234" }), null);
const usdcRequest = buildPrivyUsdcTransferRequest({
  appId: "app-id",
  walletId: "wallet-id",
  recipient: "0x000000000000000000000000000000000000dEaD",
  amountUSDC: 2,
  idempotencyKey: "refusal-test-000000000000000000000000",
  requestExpiry: Date.now() + 60_000,
});
assert.equal(usdcRequest?.body.params.transaction.to, "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238");
assert.match(usdcRequest?.body.params.transaction.data ?? "", /^0xa9059cbb/);
assert.equal(buildPrivyUsdcTransferRequest({ ...usdcInput(), amountUSDC: 0 }), null);

const previous = { ...process.env };
for (const key of [
  "PRIVY_APP_ID",
  "PRIVY_APP_SECRET",
  "PRIVY_WALLET_ID",
  "PRIVY_SERVER_AUTHORIZATION_PRIVATE_KEY",
]) delete process.env[key];
const refused = await executePrivySend({
  recipient: "0x000000000000000000000000000000000000dEaD",
  amountUSDC: 1,
  userSignature: "",
  idempotencyKey: "refusal-test-000000000000000000000000",
});
assert.deepEqual(refused, {
  signed: false,
  txHash: null,
  reasonCode: "REF-04 HUMAN_DENIED_TIMEOUT",
  signer: "privy",
});
Object.assign(process.env, previous);

console.log("PASS: Privy config, request construction, and fail-closed auth");

function requestInput() {
  return {
    appId: "app-id",
    walletId: "wallet-id",
    to: "0x000000000000000000000000000000000000dEaD",
    valueWei: "0x01",
    idempotencyKey: "refusal-test-000000000000000000000000",
    requestExpiry: Date.now() + 60_000,
  };
}

function usdcInput() {
  return {
    appId: "app-id",
    walletId: "wallet-id",
    recipient: "0x000000000000000000000000000000000000dEaD",
    amountUSDC: 1,
    idempotencyKey: "refusal-test-000000000000000000000000",
    requestExpiry: Date.now() + 60_000,
  };
}
