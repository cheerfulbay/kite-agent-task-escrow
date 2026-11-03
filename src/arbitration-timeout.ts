export interface EscrowTaskLock {
  taskId: string;
  depositAmount: bigint;
  lockedAt: number;
  timeoutSeconds: number;
  status: 'PENDING' | 'RESOLVED' | 'REFUNDED';
}

export class ArbitrationTimeoutHandler {
  public isExpired(lock: EscrowTaskLock): boolean {
    const now = Math.floor(Date.now() / 1000);
    return now >= lock.lockedAt + lock.timeoutSeconds;
  }

  public evaluateAutoRefund(lock: EscrowTaskLock): boolean {
    if (lock.status === 'PENDING' && this.isExpired(lock)) {
      lock.status = 'REFUNDED';
      return true;
    }
    return false;
  }
}
