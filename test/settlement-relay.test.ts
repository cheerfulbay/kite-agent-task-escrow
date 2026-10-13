import { describe, it, expect } from 'vitest';
import { SettlementAuthorizationRelay, AuthorizationPayload } from '../src/settlement-relay.js';
import { Hex } from 'viem';

describe('SettlementAuthorizationRelay', () => {
  const auth: AuthorizationPayload = {
    taskId: '0x1111111111111111111111111111111111111111111111111111111111111111',
    employer: '0x2222222222222222222222222222222222222222',
    recipientAgent: '0x3333333333333333333333333333333333333333',
    amountWei: 2500n,
    nonce: '0x4444444444444444444444444444444444444444444444444444444444444444',
    expiryTimestamp: 2_000_000,
  };

  it('computes deterministic authorization voucher digest', () => {
    const digest1 = SettlementAuthorizationRelay.computeAuthorizationDigest(auth);
    const digest2 = SettlementAuthorizationRelay.computeAuthorizationDigest(auth);
    expect(digest1).toBe(digest2);
    expect(digest1.startsWith('0x')).toBe(true);
    expect(digest1.length).toBe(66);
  });

  it('validates active voucher and rejects expired voucher', () => {
    expect(SettlementAuthorizationRelay.isAuthorizationValid(auth, 1_500_000)).toBe(true);
    expect(SettlementAuthorizationRelay.isAuthorizationValid(auth, 2_000_001)).toBe(false);
  });
});
