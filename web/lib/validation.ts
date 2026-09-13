import { getAddress, isAddress } from "viem";

/** Parse a positive, integer USDC amount without accepting exponent notation. */
export function parseStrictAmount(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "number" && !Number.isSafeInteger(value)) return null;
  const raw = typeof value === "number" ? String(value) : value.trim();
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const amount = Number(raw);
  if (!Number.isSafeInteger(amount)) return null;
  return amount;
}

/** Accept only a valid EVM address and return its checksum representation. */
export function parseStrictAddress(value: unknown): `0x${string}` | null {
  if (typeof value !== "string" || !isAddress(value)) return null;
  return getAddress(value);
}
