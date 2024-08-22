export enum DataJobStatusTypeEnum {
  PENDING = 'PENDING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}

export const DATA_JOB_STATUS = [
  DataJobStatusTypeEnum.PENDING,
  DataJobStatusTypeEnum.COMPLETE,
  DataJobStatusTypeEnum.ERROR,
] as const;

export type DataJobStatusType = (typeof DATA_JOB_STATUS)[number];

export interface DataJob {
  status: DataJobStatusType;
  data: any;
  error?: any;
}
