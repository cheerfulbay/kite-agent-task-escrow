import { describe, it, expect } from 'vitest';
import { KiteTaskEscrowClient } from '../src/escrow-client.js';

describe('KiteTaskEscrowClient', () => {
  it('computes deterministic keccak256 task digest from metadata', () => {
    const title = 'Audit MultiSig Contract';
    const desc = 'Perform deep automated symbolic analysis on vault parameters';

    const d1 = KiteTaskEscrowClient.computeTaskDigest(title, desc);
    const d2 = KiteTaskEscrowClient.computeTaskDigest(title, desc);

    expect(d1).toBe(d2);
    expect(d1.startsWith('0x')).toBe(true);
    expect(d1.length).toBe(66);
  });

  it('determines deadline expiration status correctly', () => {
    const deadline = 1718000000;
    expect(KiteTaskEscrowClient.isDeadlinePassed(deadline, 1717999999)).toBe(false);
    expect(KiteTaskEscrowClient.isDeadlinePassed(deadline, 1718000001)).toBe(true);
  });
});
