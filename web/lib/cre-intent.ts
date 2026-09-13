import { canonicalEnsName } from "./ensv2";
import { parseStrictAddress, parseStrictAmount } from "./validation";

export interface CreIntentInput {
  fromENS: unknown;
  to: unknown;
  amountUSDC: unknown;
}

export interface CreIntent {
  fromENS: string;
  to: `0x${string}`;
  amountUSDC: number;
}

export function parseCreIntent(input: CreIntentInput): CreIntent | null {
  const fromENS = canonicalEnsName(input.fromENS);
  const to = parseStrictAddress(input.to);
  const amountUSDC = parseStrictAmount(input.amountUSDC);
  if (!fromENS || !to || amountUSDC === null) return null;
  return { fromENS, to, amountUSDC };
}
