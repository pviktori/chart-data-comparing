import { DatabaseType, DataSourceDto } from 'src/data-sources/dto';

export interface SessionDto {
  id: string;
  dataSourceId: string;
  databaseType: DatabaseType;
  features: string[];
  dataTimerangeStart: string | null;
  dataTimerangeStop: string | null;
  filters: SessionFilter[];
  dataset: string;
  createdAt: string;

  dataSource?: DataSourceDto;
}

export interface CreateSessionDto extends Omit<SessionDto, 'id' | 'dataSource'> {}


export interface SessionFilter {
  feature: string;
  operator: string;
  value: string | number | (string | number)[];
  tag: string;
  type: string;
}
