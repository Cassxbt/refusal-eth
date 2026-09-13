import { createPublicClient, formatEther, getAddress, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { normalize } from "viem/ens";

const rpcUrl = process.env.SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";
const parentRaw = process.env.PARENT_NAME?.trim() || null;
const client = createPublicClient({ chain: sepolia, transport: http(rpcUrl) });

const deployments = {
  ethRegistry: "0xbdc85dd5b15d7ecb354cd7cb6f2c50b4f2c4f0e2",
  ethRegistrar: "0xa88553f454b77203b0d036a05c894d555eaaa2cc",
  universalResolver: "0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe",
  permissionedResolverImpl: "0x9eae5c2730a7dd16bdd1dee6421a1b91e3b0365e",
  verifiableFactory: "0x10dc6333cdfe1fcef624c6e0a8221b91804cd7ef",
};

const code = {};
for (const [name, address] of Object.entries(deployments)) {
  code[name] = (await client.getCode({ address })).length > 2;
}

const result = {
  chainId: await client.getChainId(),
  blockNumber: (await client.getBlockNumber()).toString(),
  deployments,
  deployedCode: code,
  wallet: null,
  parent: null,
};

if (process.env.PRIVATE_KEY?.trim()) {
  const account = privateKeyToAccount(process.env.PRIVATE_KEY.trim());
  result.wallet = {
    address: getAddress(account.address),
    balanceSepoliaETH: formatEther(await client.getBalance({ address: account.address })),
  };
}

if (parentRaw) {
  let parent;
  try {
    parent = normalize(parentRaw);
  } catch {
    result.parent = { input: parentRaw, error: "invalid ENS name" };
  }
  if (parent) {
    const [address, resolver] = await Promise.all([
      client.getEnsAddress({ name: parent }).catch(() => null),
      client.getEnsResolver({ name: parent }).catch(() => null),
    ]);
    result.parent = { name: parent, address, resolver, resolved: Boolean(address) };
  }
}

console.log(JSON.stringify(result, null, 2));
