import { PrivyClient } from "@privy-io/node";

const APP_ID = process.env.PRIVY_APP_ID?.trim();
const APP_SECRET = process.env.PRIVY_APP_SECRET?.trim();
const EXTERNAL_ID = (process.env.PRIVY_WALLET_EXTERNAL_ID?.trim() || "refusal-eth-agent-sepolia");
const DISPLAY_NAME = (process.env.PRIVY_WALLET_DISPLAY_NAME?.trim() || "REFUSAL agent — Sepolia");
const OWNER_ID = process.env.PRIVY_OWNER_ID?.trim();
const POLICY_ID = process.env.PRIVY_POLICY_ID?.trim();

function fail(message) {
  console.error(`Privy bootstrap: ${message}`);
  process.exitCode = 1;
}

if (!APP_ID || !APP_SECRET) {
  fail("set PRIVY_APP_ID and PRIVY_APP_SECRET in the local environment; neither is read from a file or printed");
} else if (!/^[a-zA-Z0-9_-]{1,64}$/.test(EXTERNAL_ID)) {
  fail("PRIVY_WALLET_EXTERNAL_ID must contain only letters, numbers, _ or - (max 64 characters)");
} else {
  const client = new PrivyClient({ appId: APP_ID, appSecret: APP_SECRET });
  const existing = [];

  try {
    for await (const wallet of client.wallets().list({
      chain_type: "ethereum",
      external_id: EXTERNAL_ID,
      include_archived: false,
    })) {
      existing.push(wallet);
    }

    if (existing.length > 1) {
      fail(`found ${existing.length} active Ethereum wallets for external ID ${EXTERNAL_ID}; resolve the duplicate in Privy before continuing`);
    } else {
      const wallet = existing[0] ?? await client.wallets().create({
        chain_type: "ethereum",
        display_name: DISPLAY_NAME,
        external_id: EXTERNAL_ID,
        ...(OWNER_ID ? { owner_id: OWNER_ID } : {}),
        ...(POLICY_ID ? { policy_ids: [POLICY_ID] } : {}),
        idempotency_key: `refusal-eth-wallet-${EXTERNAL_ID}`,
      });

      console.log(JSON.stringify({
        walletId: wallet.id,
        address: wallet.address,
        chainType: wallet.chain_type,
        externalId: wallet.external_id ?? EXTERNAL_ID,
        ownerId: wallet.owner_id,
        policyIds: wallet.policy_ids,
        created: existing.length === 0,
      }, null, 2));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown Privy API error";
    fail(`request failed (${message}); no transaction was submitted`);
  }
}
