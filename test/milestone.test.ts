import { describe, it, expect } from 'vitest';
import { MilestoneReleaseManager } from '../src/milestone-manager.js';
import { type Hex } from 'viem';

describe('MilestoneReleaseManager', () => {
  it('enforces total 100% milestone weight allocation', () => {
    const manager = new MilestoneReleaseManager();
    expect(() => {
      manager.registerMilestones('task-1', [{ weightPercentage: 40 }, { weightPercentage: 50 }]);
    }).toThrow('must sum to 100%');

    manager.registerMilestones('task-1', [
      { weightPercentage: 30 },
      { weightPercentage: 70 },
    ]);
    expect(manager.getMilestones('task-1')).toHaveLength(2);
  });

  it('correctly tracks deliverable unlock state', () => {
    const manager = new MilestoneReleaseManager();
    manager.registerMilestones('task-2', [
      { weightPercentage: 50 },
      { weightPercentage: 50 },
    ]);

    const fakeHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as Hex;
    const unlockedPct = manager.unlockMilestone('task-2', 0, fakeHash);
    expect(unlockedPct).toBe(50n);

    const m = manager.getMilestones('task-2');
    expect(m[0].isUnlocked).toBe(true);
    expect(m[0].deliverableHash).toBe(fakeHash);
    expect(m[1].isUnlocked).toBe(false);
  });
});
