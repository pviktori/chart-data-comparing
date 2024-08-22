import { Injectable } from '@nestjs/common';
import { DataJob, DataJobStatusType, DataJobStatusTypeEnum } from './dto';

@Injectable()
export class DataJobService {
  private jobs: Map<string, DataJob> = new Map();

  createJob(sessionId: string): void {
    this.setStatus(sessionId, DataJobStatusTypeEnum.PENDING);
  }

  getStatus(sessionId: string): DataJobStatusType {
    const job = this.jobs.get(sessionId);
    if (!job) {
      throw new Error('Job not found');
    }
    return job.status;
  }

  getData<T>(sessionId: string): T {
    const job = this.jobs.get(sessionId);
    if (!job) {
      throw new Error('Job not found');
    }

    this.removeJod(sessionId);

    if (job.error) {
      throw new Error(job.error);
    }

    return job.data as T;
  }

  setStatus(
    sessionId: string,
    status: DataJobStatusType,
    data: any = null,
    error: any = null,
  ): void {
    this.jobs.set(sessionId, { status, data, error });
  }

  removeJod(sessionId: string) {
    this.jobs.delete(sessionId);
  }
}
