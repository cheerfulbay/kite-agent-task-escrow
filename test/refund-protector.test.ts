import { describe, it, expect } from 'vitest';
import { EscrowRefundProtector } from '../src/refund-protector.js';

describe('EscrowRefundProtector', () => {
  const protector = new EscrowRefundProtector();

  it('issues full refund when contractor defaults or deadline passes', () => {
    const total = 10_000n;
    const unlocked = 2_000n;
    const start = 1_000_000;
    const deadline = 1_005_000;
    const now = 1_006_000; // Past deadline

    const res = protector.calculateRefund(total, unlocked, start, deadline, now, false);
    expect(res.eligibleForFullRefund).toBe(true);
    expect(res.employerRefundWei).toBe(8_000n);
    expect(res.contractorCompensationWei).toBe(0n);
  });

  it('issues full refund during initial grace period', () => {
    const total = 10_000n;
    const unlocked = 0n;
    const start = 1_000_000;
    const deadline = 1_050_000;
    const now = 1_001_800; // 30 mins into 1 hour grace period

    const res = protector.calculateRefund(total, unlocked, start, deadline, now, false);
    expect(res.eligibleForFullRefund).toBe(true);
    expect(res.employerRefundWei).toBe(10_000n);
  });

  it('deducts cancellation penalty to compensate contractor for mid-task cancellation', () => {
    const total = 10_000n;
    const unlocked = 0n;
    const start = 1_000_000;
    const deadline = 1_050_000;
    const now = 1_010_000; // Past grace period

    const res = protector.calculateRefund(total, unlocked, start, deadline, now, false);
    expect(res.eligibleForFullRefund).toBe(false);
    expect(res.contractorCompensationWei).toBe(500n); // 5% of 10,000
    expect(res.employerRefundWei).toBe(9_500n);
  });
});
