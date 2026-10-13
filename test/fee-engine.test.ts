import { describe, it, expect } from 'vitest';
import { ProtocolFeeEngine } from '../src/fee-engine.js';

describe('ProtocolFeeEngine', () => {
  const engine = new ProtocolFeeEngine();

  it('applies standard 2.5% fee tier for smaller bounties', () => {
    const res = engine.calculateFee(1_000_000n);
    expect(res.appliedFeeBps).toBe(250);
    expect(res.feeAmountWei).toBe(25_000n);
    expect(res.contractorNetWei).toBe(975_000n);
  });

  it('applies reduced 1.5% fee tier for volume >= 10 ETH', () => {
    const bounty = 10_000_000_000_000_000_000n; // 10 ETH
    const res = engine.calculateFee(bounty);
    expect(res.appliedFeeBps).toBe(150);
    expect(res.feeAmountWei).toBe(150_000_000_000_000_000n);
    expect(res.contractorNetWei).toBe(9_850_000_000_000_000_000n);
  });

  it('throws on zero or negative bounty', () => {
    expect(() => engine.calculateFee(0n)).toThrow('totalBountyWei must be strictly positive');
  });
});
