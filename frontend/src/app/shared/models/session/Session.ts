import { DatabaseUnit, DataSource } from '../data-sources';

export interface Session {
  id: string;
  dataSourceId: string;
  databaseType: DatabaseUnit;
  features: string[];

  dataSource?: DataSource;

  dataTimerangeStart: string | null;
  dataTimerangeStop: string | null;
  filters: SessionFilter[];
  dataset: string | null;
}

export interface CreateSession extends Omit<Session, 'id' > {
}

export interface SessionFilter {
  feature: string;
  operator: string;
  value: string | number | (string | number)[];
  tag: string;
}
