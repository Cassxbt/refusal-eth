import { PrivyClient, type WalletApiRequestSignatureInput } from "@privy-io/node";
import { encodeFunctionData, getAddress, isAddress, type Hex } from "viem";

const SEPOLIA_CAIP2 = "eip155:11155111";
// Circle's current Ethereum Sepolia USDC address.
// Source: https://developers.circle.com/stablecoins/usdc-contract-addresses
const SEPOLIA_USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as const;
const REFUSAL_ON_MISSING_AUTH = "REF-04 HUMAN_DENIED_TIMEOUT";
const REFUSAL_ON_INVALID_INTENT = "REF-02 SEALED_LIMIT_BREACH";

const ERC20_TRANSFER_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
] as const;

type PrivyEnv = {
  appId: string;
  appSecret: string;
  walletId: string;
  serverAuthorizationPrivateKey: string;
};

export type PrivySendRequest = WalletApiRequestSignatureInput & {
  body: {
    caip2: typeof SEPOLIA_CAIP2;
    chain_type: "ethereum";
    method: "eth_sendTransaction";
    params: {
      transaction: {
        to: `0x${string}`;
        value: Hex;
        data: Hex;
      };
    };
    wallet_id: string;
  };
};

export type PrivyExecutionResult = {
  signed: boolean;
  txHash: string | null;
  reasonCode: string;
  signer: "privy";
};

function readPrivyEnv(env: NodeJS.ProcessEnv = process.env): PrivyEnv | null {
  const appId = env.PRIVY_APP_ID?.trim();
  const appSecret = env.PRIVY_APP_SECRET?.trim();
  const walletId = env.PRIVY_WALLET_ID?.trim();
  const serverAuthorizationPrivateKey = env.PRIVY_SERVER_AUTHORIZATION_PRIVATE_KEY?.trim();
  if (!appId || !appSecret || !walletId || !serverAuthorizationPrivateKey) return null;
  return { appId, appSecret, walletId, serverAuthorizationPrivateKey };
}

export function buildPrivySendRequest(input: {
  appId: string;
  walletId: string;
  to: string;
  valueWei: string;
  data?: string;
  idempotencyKey: string;
  requestExpiry: number;
}): PrivySendRequest | null {
  if (!isAddress(input.to) || !/^0x[0-9a-fA-F]+$/.test(input.valueWei)) return null;
  if (!/^0x[0-9a-fA-F]*$/.test(input.data ?? "0x")) return null;
  if (!Number.isSafeInteger(input.requestExpiry) || input.requestExpiry <= Date.now()) return null;
  return {
    version: 1,
    url: `https://api.privy.io/v1/wallets/${input.walletId}/rpc`,
    method: "POST",
    headers: {
      "privy-app-id": input.appId,
      "privy-idempotency-key": input.idempotencyKey,
      "privy-request-expiry": String(input.requestExpiry),
    },
    body: {
      caip2: SEPOLIA_CAIP2,
      chain_type: "ethereum",
      method: "eth_sendTransaction",
      params: {
        transaction: {
          to: getAddress(input.to),
          value: input.valueWei as Hex,
          data: (input.data ?? "0x") as Hex,
        },
      },
      wallet_id: input.walletId,
    },
  };
}

export function buildPrivyUsdcTransferRequest(input: {
  appId: string;
  walletId: string;
  recipient: string;
  amountUSDC: number;
  idempotencyKey: string;
  requestExpiry: number;
}): PrivySendRequest | null {
  if (!Number.isSafeInteger(input.amountUSDC) || input.amountUSDC <= 0) return null;
  const recipient = isAddress(input.recipient) ? getAddress(input.recipient) : null;
  if (!recipient) return null;
  const data = encodeFunctionData({
    abi: ERC20_TRANSFER_ABI,
    functionName: "transfer",
    args: [recipient, BigInt(input.amountUSDC) * 1_000_000n],
  });
  return buildPrivySendRequest({
    appId: input.appId,
    walletId: input.walletId,
    to: SEPOLIA_USDC,
    valueWei: "0x0",
    data,
    idempotencyKey: input.idempotencyKey,
    requestExpiry: input.requestExpiry,
  });
}

/**
 * Send a Sepolia transaction only after the client has supplied its user
 * authorization signature. The server key and Privy app secret are read only
 * from server-side environment variables; no fallback signer exists.
 */
export async function executePrivySend(input: {
  recipient: string;
  amountUSDC: number;
  userSignature: string;
  idempotencyKey: string;
}): Promise<PrivyExecutionResult> {
  const env = readPrivyEnv();
  if (!env || !input.userSignature.trim()) {
    return { signed: false, txHash: null, reasonCode: REFUSAL_ON_MISSING_AUTH, signer: "privy" };
  }

  const request = buildPrivyUsdcTransferRequest({
    appId: env.appId,
    walletId: env.walletId,
    recipient: input.recipient,
    amountUSDC: input.amountUSDC,
    idempotencyKey: input.idempotencyKey,
    requestExpiry: Date.now() + 60_000,
  });
  if (!request) {
    return { signed: false, txHash: null, reasonCode: REFUSAL_ON_INVALID_INTENT, signer: "privy" };
  }

  try {
    const privy = new PrivyClient({ appId: env.appId, appSecret: env.appSecret });
    const response = await privy.wallets().rpc(env.walletId, {
      ...request.body,
      authorization_context: {
        authorization_private_keys: [env.serverAuthorizationPrivateKey],
        signatures: [input.userSignature],
      },
      idempotency_key: input.idempotencyKey,
      request_expiry: Number(request.headers["privy-request-expiry"]),
    });
    const txHash = response.data && "hash" in response.data && typeof response.data.hash === "string"
      ? response.data.hash
      : null;
    if (typeof txHash !== "string" || !txHash) {
      return { signed: false, txHash: null, reasonCode: REFUSAL_ON_MISSING_AUTH, signer: "privy" };
    }
    return { signed: true, txHash, reasonCode: "ALLOW", signer: "privy" };
  } catch {
    return { signed: false, txHash: null, reasonCode: REFUSAL_ON_MISSING_AUTH, signer: "privy" };
  }
}

export function privyConfigPresent(env: NodeJS.ProcessEnv = process.env): boolean {
  return readPrivyEnv(env) !== null;
}
