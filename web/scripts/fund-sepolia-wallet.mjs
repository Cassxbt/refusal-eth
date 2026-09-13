import { createPublicClient, createWalletClient, formatEther, getAddress, http, isAddress, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const rpcUrl = process.env.SEPOLIA_RPC_URL?.trim() || "https://ethereum-sepolia-rpc.publicnode.com";
const privateKey = process.env.SEPOLIA_FUNDER_PRIVATE_KEY?.trim();
const destinationRaw = process.env.PRIVY_WALLET_ADDRESS?.trim();
const amountRaw = process.env.FUND_AMOUNT_ETH?.trim() || "0.01";

function fail(message) {
  console.error(`Sepolia funding: ${message}`);
  process.exitCode = 1;
}

if (!privateKey || !/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
  fail("set SEPOLIA_FUNDER_PRIVATE_KEY to a 32-byte hex key in the local environment");
} else if (!destinationRaw || !isAddress(destinationRaw)) {
  fail("set PRIVY_WALLET_ADDRESS to the checksumable destination wallet address");
} else {
  let amount;
  try {
    amount = parseEther(amountRaw);
  } catch {
    amount = null;
  }

  if (amount === null || amount <= 0n) {
    fail("FUND_AMOUNT_ETH must be a positive decimal amount");
  } else {
    try {
      const account = privateKeyToAccount(privateKey);
      const destination = getAddress(destinationRaw);
      const publicClient = createPublicClient({ chain: sepolia, transport: http(rpcUrl) });
      const walletClient = createWalletClient({ account, chain: sepolia, transport: http(rpcUrl) });
      const chainId = await publicClient.getChainId();
      if (chainId !== sepolia.id) throw new Error(`RPC chain is ${chainId}, expected ${sepolia.id}`);
      if (account.address.toLowerCase() === destination.toLowerCase()) throw new Error("source and destination are identical");

      const balance = await publicClient.getBalance({ address: account.address });
      const gasPrice = await publicClient.getGasPrice();
      const gas = await publicClient.estimateGas({ account, to: destination, value: amount });
      const feeReserve = gas * gasPrice;
      if (balance < amount + feeReserve) {
        throw new Error(`insufficient balance: have ${formatEther(balance)} ETH, need at least ${formatEther(amount + feeReserve)} ETH`);
      }

      const hash = await walletClient.sendTransaction({ to: destination, value: amount, gas });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error(`transaction reverted: ${hash}`);

      console.log(JSON.stringify({
        chainId,
        source: account.address,
        destination,
        amountEth: amountRaw,
        txHash: hash,
        blockNumber: receipt.blockNumber.toString(),
        status: receipt.status,
      }, null, 2));
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown RPC or wallet error";
      fail(`${message}; no retry was attempted`);
    }
  }
}
