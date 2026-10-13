export interface RefundPolicy {
  gracePeriodSeconds: number;
  minimumElapsedPercentageForPartial: number; // e.g. 50% time elapsed
  employerCancellationPenaltyBps: number; // Penalty basis points deducted if employer cancels without cause
}

export interface RefundCalculationResult {
  eligibleForFullRefund: boolean;
  employerRefundWei: bigint;
  contractorCompensationWei: bigint;
  penaltyFeeWei: bigint;
}

export const DEFAULT_REFUND_POLICY: RefundPolicy = {
  gracePeriodSeconds: 3600, // 1 hour grace period
  minimumElapsedPercentageForPartial: 50,
  employerCancellationPenaltyBps: 500, // 5% penalty
};

/**
 * EscrowRefundProtector
 * Calculates fair refunds and contractor compensation during task cancellations or abandonments
 */
export class EscrowRefundProtector {
  private policy: RefundPolicy;

  constructor(policy: RefundPolicy = DEFAULT_REFUND_POLICY) {
    this.policy = policy;
  }

  public calculateRefund(
    totalLockedWei: bigint,
    unlockedWei: bigint,
    startTime: number,
    deadline: number,
    currentTime: number,
    isContractorDefault: boolean
  ): RefundCalculationResult {
    if (totalLockedWei <= 0n) {
      throw new Error('Total locked amount must be positive');
    }

    const remainingLockedWei = totalLockedWei - unlockedWei;
    if (remainingLockedWei < 0n) {
      throw new Error('Unlocked amount exceeds total locked');
    }

    // Case 1: Contractor defaulted / deadline elapsed without deliverable
    if (isContractorDefault || currentTime > deadline) {
      return {
        eligibleForFullRefund: true,
        employerRefundWei: remainingLockedWei,
        contractorCompensationWei: 0n,
        penaltyFeeWei: 0n,
      };
    }

    // Case 2: Cancellation during initial grace period
    if (currentTime <= startTime + this.policy.gracePeriodSeconds) {
      return {
        eligibleForFullRefund: true,
        employerRefundWei: remainingLockedWei,
        contractorCompensationWei: 0n,
        penaltyFeeWei: 0n,
      };
    }

    // Case 3: Employer voluntary cancellation mid-task
    const penaltyWei = (remainingLockedWei * BigInt(this.policy.employerCancellationPenaltyBps)) / 10000n;
    const contractorComp = penaltyWei; // Penalty is awarded to contractor for lost time
    const employerRefund = remainingLockedWei - penaltyWei;

    return {
      eligibleForFullRefund: false,
      employerRefundWei: employerRefund,
      contractorCompensationWei: contractorComp,
      penaltyFeeWei: 0n,
    };
  }
}
