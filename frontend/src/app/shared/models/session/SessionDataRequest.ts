export interface SessionDataRequest {
  start: number;
  queryErrors: number;
  stop?: number;
  skipAggregate?: number;
  page?: number;
  pageSize?: number;
}
