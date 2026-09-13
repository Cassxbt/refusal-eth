import { createPublicKey, readFileSync } from "node:crypto";
import { PrivyClient } from "@privy-io/node";

const APP_ID = process.env.PRIVY_APP_ID?.trim();
const APP_SECRET = process.env.PRIVY_APP_SECRET?.trim();
const PUBLIC_KEY_PATH = process.env.PRIVY_AUTHORIZATION_PUBLIC_KEY_PATH?.trim()
  || "/Users/apple/.privy/refusal-eth/server-public.pem";
const KEY_QUORUM_ID = process.env.PRIVY_KEY_QUORUM_ID?.trim();
const POLICY_ID = process.env.PRIVY_POLICY_ID?.trim();
const CREATE_KEY_QUORUM = process.argv.includes("--create-key-quorum");
const CREATE_POLICY = process.argv.includes("--create-policy");
const POLICY_NAME = process.env.PRIVY_POLICY_NAME?.trim() || "REFUSAL Sepolia USDC Gate";
const QUORUM_NAME = process.env.PRIVY_QUORUM_NAME?.trim() || "REFUSAL Server Gate";
const SEPOLIA_USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

function fail(message) {
  console.error(`Privy controls bootstrap: ${message}`);
  process.exitCode = 1;
}

function publicKeyDerBase64(path) {
  const pem = readFileSync(path);
  return createPublicKey(pem).export({ type: "spki", format: "der" }).toString("base64");
}

if (!APP_ID || !APP_SECRET) {
  fail("set PRIVY_APP_ID and PRIVY_APP_SECRET in the local environment");
} else if (!KEY_QUORUM_ID && !CREATE_KEY_QUORUM) {
  fail("provide PRIVY_KEY_QUORUM_ID to validate an existing quorum or pass --create-key-quorum once");
} else if (!POLICY_ID && !CREATE_POLICY) {
  fail("provide PRIVY_POLICY_ID to validate an existing policy or pass --create-policy once");
} else {
  try {
    const client = new PrivyClient({ appId: APP_ID, appSecret: APP_SECRET });
    let quorum = null;
    let policy = null;

    if (KEY_QUORUM_ID) {
      quorum = await client.keyQuorums().get(KEY_QUORUM_ID);
    } else {
      quorum = await client.keyQuorums().create({
        authorization_threshold: 1,
        display_name: QUORUM_NAME,
        public_keys: [publicKeyDerBase64(PUBLIC_KEY_PATH)],
      });
    }

    if (POLICY_ID) {
      policy = await client.policies().get(POLICY_ID);
    } else {
      policy = await client.policies().create({
        chain_type: "ethereum",
        name: POLICY_NAME,
        version: "1.0",
        rules: [{
          action: "ALLOW",
          conditions: [
            {
              field: "chain_id",
              field_source: "ethereum_transaction",
              operator: "eq",
              value: "11155111",
            },
            {
              field: "to",
              field_source: "ethereum_transaction",
              operator: "eq",
              value: SEPOLIA_USDC,
            },
          ],
          method: "eth_sendTransaction",
          name: "Sepolia USDC contract only",
        }],
        idempotency_key: "refusal-eth-sepolia-usdc-policy-v1",
      });
    }

    console.log(JSON.stringify({
      keyQuorumId: quorum.id,
      policyId: policy.id,
      authorizationThreshold: quorum.authorization_threshold,
      policyChain: policy.chain_type,
      policyMethods: policy.rules?.map((rule) => rule.method) ?? [],
      policyDestination: SEPOLIA_USDC,
      createdKeyQuorum: !KEY_QUORUM_ID,
      createdPolicy: !POLICY_ID,
    }, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown Privy API error";
    fail(`request failed (${message}); no wallet transaction was submitted`);
  }
}
