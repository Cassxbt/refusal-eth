/// Shared signer vocabulary. Receipt reason codes match cre-workflow ReasonCode
/// ("REF-01" hyphen form offchain; see contracts/RefusalGateway.sol for onchain map).
export type SignerKind = "privy" | "local-ephemeral" | "ledger-ring";
export interface SignRequest {
  agentENS: string;
  to: string;
  amountUSDC: number;
  proofId: string;
  verdictSig: string | null; // null = no ALLOW receipt → must refuse
  verdictVerified: boolean; // cryptographically verified by the caller
  userSignature?: string; // Privy user authorization signature
  idempotencyKey?: string;
}
export interface SignResult {
  signed: boolean;
  txHash: string | null;
  reasonCode: string;
  signer: SignerKind;
}
export interface Signer {
  kind: SignerKind;
  sign(req: SignRequest): Promise<SignResult>;
}
