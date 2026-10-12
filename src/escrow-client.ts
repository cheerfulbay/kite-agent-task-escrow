import { type Hex, encodePacked, keccak256 } from 'viem';
import { z } from 'zod';

export const TaskSpecSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  bountyWei: z.bigint().positive(),
  durationSeconds: z.number().int().min(60),
});

export type TaskSpec = z.infer<typeof TaskSpecSchema>;

export class KiteTaskEscrowClient {
  public static computeTaskDigest(title: string, description: string): Hex {
    return keccak256(encodePacked(['string', 'string'], [title, description]));
  }

  public static computeTaskId(taskDigest: Hex, employer: Hex, timestamp: bigint): Hex {
    return keccak256(encodePacked(['bytes32', 'address', 'uint256'], [taskDigest, employer, timestamp]));
  }

  public static isDeadlinePassed(deadline: number, currentTimestamp: number): boolean {
    return currentTimestamp > deadline;
  }
}
