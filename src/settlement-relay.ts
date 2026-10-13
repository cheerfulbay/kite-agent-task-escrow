import { type Hex, encodePacked, keccak256 } from 'viem';

export interface AuthorizationPayload {
  taskId: Hex;
  employer: Hex;
  recipientAgent: Hex;
  amountWei: bigint;
  nonce: Hex;
  expiryTimestamp: number;
}

/**
 * SettlementAuthorizationRelay
 * Signs and verifies cryptographic release vouchers for x402 Facilitator disbursement
 */
export class SettlementAuthorizationRelay {
  public static computeAuthorizationDigest(auth: AuthorizationPayload): Hex {
    return keccak256(
      encodePacked(
        ['bytes32', 'address', 'address', 'uint256', 'bytes32', 'uint256'],
        [
          auth.taskId,
          auth.employer,
          auth.recipientAgent,
          auth.amountWei,
          auth.nonce,
          BigInt(auth.expiryTimestamp),
        ]
      )
    );
  }

  public static isAuthorizationValid(auth: AuthorizationPayload, now: number = Date.now()): boolean {
    if (auth.amountWei <= 0n) return false;
    if (now >= auth.expiryTimestamp) return false;
    return true;
  }
}
