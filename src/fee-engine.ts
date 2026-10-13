import { type Hex, isHex } from 'viem';

export interface FeeTier {
  minVolumeWei: bigint;
  feeBasisPoints: number; // e.g. 200 = 2.0%
}

export interface ProtocolFeeResult {
  totalBountyWei: bigint;
  feeAmountWei: bigint;
  contractorNetWei: bigint;
  appliedFeeBps: number;
}

export const DEFAULT_FEE_TIERS: FeeTier[] = [
  { minVolumeWei: 100_000_000_000_000_000_000n, feeBasisPoints: 100 }, // >= 100 ETH: 1.0%
  { minVolumeWei: 10_000_000_000_000_000_000n, feeBasisPoints: 150 },  // >= 10 ETH: 1.5%
  { minVolumeWei: 0n, feeBasisPoints: 250 },                            // Standard: 2.5%
];

/**
 * ProtocolFeeEngine
 * Computes tiered protocol commission rates based on historical volume and task size
 */
export class ProtocolFeeEngine {
  private feeTiers: FeeTier[];

  constructor(feeTiers: FeeTier[] = DEFAULT_FEE_TIERS) {
    this.feeTiers = [...feeTiers].sort((a, b) => (b.minVolumeWei > a.minVolumeWei ? 1 : -1));
  }

  public calculateFee(totalBountyWei: bigint): ProtocolFeeResult {
    if (totalBountyWei <= 0n) {
      throw new Error('totalBountyWei must be strictly positive');
    }

    let appliedFeeBps = 250;
    for (const tier of this.feeTiers) {
      if (totalBountyWei >= tier.minVolumeWei) {
        appliedFeeBps = tier.feeBasisPoints;
        break;
      }
    }

    const feeAmountWei = (totalBountyWei * BigInt(appliedFeeBps)) / 10000n;
    const contractorNetWei = totalBountyWei - feeAmountWei;

    return {
      totalBountyWei,
      feeAmountWei,
      contractorNetWei,
      appliedFeeBps,
    };
  }
}
