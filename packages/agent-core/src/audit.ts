export interface AuditRecord {
  ts: number;
  stage: 'perceive' | 'plan' | 'act' | 'verify' | 'report' | 'policy' | 'error';
  message: string;
  data?: unknown;
}

export class AuditLogger {
  private readonly records: AuditRecord[] = [];

  add(stage: AuditRecord['stage'], message: string, data?: unknown): void {
    this.records.push({ ts: Date.now(), stage, message, data });
  }

  all(): AuditRecord[] {
    return [...this.records];
  }
}
