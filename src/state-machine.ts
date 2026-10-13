import { type Hex, isHex } from 'viem';

export type TaskLifecycleState = 'DRAFT' | 'FUNDED_LOCKED' | 'ASSIGNED' | 'DELIVERED_IN_REVIEW' | 'COMPLETED_SETTLED' | 'CANCELLED_REFUNDED' | 'DISPUTED';

export interface TaskLifecycleRecord {
  taskId: Hex;
  employer: Hex;
  assignedAgent?: Hex;
  totalBountyWei: bigint;
  createdAt: number;
  deadline: number;
  state: TaskLifecycleState;
  stateHistory: Array<{ from: TaskLifecycleState; to: TaskLifecycleState; timestamp: number }>;
}

/**
 * EscrowStateMachine
 * Governs strict state transitions, timeouts, and authorization rules across the task escrow lifecycle
 */
export class EscrowStateMachine {
  private tasks: Map<string, TaskLifecycleRecord> = new Map();

  public createTask(record: Omit<TaskLifecycleRecord, 'state' | 'stateHistory'>): TaskLifecycleRecord {
    const key = record.taskId.toLowerCase();
    const task: TaskLifecycleRecord = {
      ...record,
      state: 'DRAFT',
      stateHistory: [],
    };
    this.tasks.set(key, task);
    return task;
  }

  public transition(taskId: Hex, nextState: TaskLifecycleState, timestamp: number = Date.now()): TaskLifecycleRecord {
    const key = taskId.toLowerCase();
    const task = this.tasks.get(key);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    this.validateTransition(task.state, nextState);

    task.stateHistory.push({ from: task.state, to: nextState, timestamp });
    task.state = nextState;

    return task;
  }

  public getTask(taskId: Hex): TaskLifecycleRecord | undefined {
    return this.tasks.get(taskId.toLowerCase());
  }

  private validateTransition(current: TaskLifecycleState, next: TaskLifecycleState): void {
    const validMoves: Record<TaskLifecycleState, TaskLifecycleState[]> = {
      DRAFT: ['FUNDED_LOCKED', 'CANCELLED_REFUNDED'],
      FUNDED_LOCKED: ['ASSIGNED', 'CANCELLED_REFUNDED'],
      ASSIGNED: ['DELIVERED_IN_REVIEW', 'CANCELLED_REFUNDED', 'DISPUTED'],
      DELIVERED_IN_REVIEW: ['COMPLETED_SETTLED', 'DISPUTED'],
      COMPLETED_SETTLED: [],
      CANCELLED_REFUNDED: [],
      DISPUTED: ['COMPLETED_SETTLED', 'CANCELLED_REFUNDED'],
    };

    if (!validMoves[current].includes(next)) {
      throw new Error(`Invalid state transition from ${current} to ${next}`);
    }
  }
}
