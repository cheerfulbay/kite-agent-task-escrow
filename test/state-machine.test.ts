import { describe, it, expect } from 'vitest';
import { EscrowStateMachine } from '../src/state-machine.js';
import { Hex } from 'viem';

describe('EscrowStateMachine', () => {
  const taskId: Hex = '0x1111111111111111111111111111111111111111111111111111111111111111';
  const employer: Hex = '0x2222222222222222222222222222222222222222';
  const agent: Hex = '0x3333333333333333333333333333333333333333';

  it('progresses happy path through full lifecycle', () => {
    const sm = new EscrowStateMachine();
    sm.createTask({
      taskId,
      employer,
      totalBountyWei: 5000n,
      createdAt: 100,
      deadline: 1000,
    });

    expect(sm.getTask(taskId)?.state).toBe('DRAFT');

    sm.transition(taskId, 'FUNDED_LOCKED');
    expect(sm.getTask(taskId)?.state).toBe('FUNDED_LOCKED');

    sm.transition(taskId, 'ASSIGNED');
    expect(sm.getTask(taskId)?.state).toBe('ASSIGNED');

    sm.transition(taskId, 'DELIVERED_IN_REVIEW');
    expect(sm.getTask(taskId)?.state).toBe('DELIVERED_IN_REVIEW');

    sm.transition(taskId, 'COMPLETED_SETTLED');
    expect(sm.getTask(taskId)?.state).toBe('COMPLETED_SETTLED');
    expect(sm.getTask(taskId)?.stateHistory.length).toBe(4);
  });

  it('rejects invalid state transition jumps', () => {
    const sm = new EscrowStateMachine();
    sm.createTask({
      taskId,
      employer,
      totalBountyWei: 5000n,
      createdAt: 100,
      deadline: 1000,
    });

    // Cannot jump from DRAFT directly to COMPLETED_SETTLED
    expect(() => sm.transition(taskId, 'COMPLETED_SETTLED')).toThrow(
      'Invalid state transition from DRAFT to COMPLETED_SETTLED'
    );
  });
});
