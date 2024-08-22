import { DatabaseType } from './database.dto';

export interface DataSourceDto {
  id: string;
  name: string;
  type: DatabaseType;
}

export interface DataSourceExtended extends DataSourceDto {
  [key: string]: string | number;
}

export type CreateDataSourceExtended = Omit<DataSourceExtended, 'id' | 'type'>;
