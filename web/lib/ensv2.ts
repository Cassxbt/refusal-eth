import { isAddress } from "viem";
import { namehash, normalize } from "viem/ens";

export const ENSV2_SEPOLIA_CHAIN_ID = 11155111;

export function canonicalEnsName(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.trim().length === 0) return null;
  try {
    return normalize(raw.trim());
  } catch {
    return null;
  }
}

export function canonicalEnsNode(raw: unknown): `0x${string}` | null {
  const name = canonicalEnsName(raw);
  return name ? namehash(name) : null;
}

export interface EnsV2Config {
  chainId: number;
  registry: `0x${string}`;
  resolver: `0x${string}`;
  universalResolver: `0x${string}`;
}

/** Read live deployment coordinates; missing or malformed values fail closed. */
export function readEnsV2Config(env: Record<string, string | undefined> = process.env): EnsV2Config | null {
  const chainId = Number(env.ENSV2_CHAIN_ID ?? ENSV2_SEPOLIA_CHAIN_ID);
  const registry = env.ENSV2_REGISTRY;
  const resolver = env.ENSV2_RESOLVER;
  const universalResolver = env.ENSV2_UNIVERSAL_RESOLVER;
  if (
    chainId !== ENSV2_SEPOLIA_CHAIN_ID ||
    !registry ||
    !resolver ||
    !universalResolver ||
    !isAddress(registry) ||
    !isAddress(resolver) ||
    !isAddress(universalResolver)
  ) return null;
  return { chainId, registry, resolver, universalResolver };
}
