import { type Hex, encodePacked, keccak256 } from 'viem';

export interface MilestoneSpec {
  milestoneIndex: number;
  weightPercentage: number;
  deliverableHash: Hex;
  isUnlocked: boolean;
}

export class MilestoneReleaseManager {
  private milestones: Map<string, MilestoneSpec[]> = new Map();

  public registerMilestones(taskId: string, specs: Array<{ weightPercentage: number }>): void {
    const total = specs.reduce((acc, curr) => acc + curr.weightPercentage, 0);
    if (total !== 100) {
      throw new Error(`Total milestone weights must sum to 100%, got ${total}%`);
    }

    const milestoneList: MilestoneSpec[] = specs.map((s, idx) => ({
      milestoneIndex: idx,
      weightPercentage: s.weightPercentage,
      deliverableHash: ('0x' + '0'.repeat(64)) as Hex,
      isUnlocked: false,
    }));

    this.milestones.set(taskId, milestoneList);
  }

  public unlockMilestone(taskId: string, index: number, deliverableHash: Hex): bigint {
    const list = this.milestones.get(taskId);
    if (!list || !list[index]) {
      throw new Error('Milestone not found');
    }
    if (list[index].isUnlocked) {
      throw new Error('Milestone already unlocked');
    }

    list[index].isUnlocked = true;
    list[index].deliverableHash = deliverableHash;
    return BigInt(list[index].weightPercentage);
  }

  public getMilestones(taskId: string): MilestoneSpec[] {
    return this.milestones.get(taskId) ?? [];
  }
}
