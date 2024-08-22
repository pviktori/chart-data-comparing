import { DatabaseTypeEnum, DatabaseUnit } from './Database';
import { DataSourceInflux } from './DataSourceInflux';

export interface DataSource {
  id: string;
  name: string;
  type: DatabaseUnit;
}

export interface DataSourcesResponse {
  [DatabaseTypeEnum.INFLUX]: DataSourceInflux[];
}

export interface CreateDataSource extends Omit<DataSource, 'id'> {}
export type DataSourceConfigs<T extends DataSource> = Omit<T, 'id' | 'name' | 'type'>;
export interface DataSourceCommonForm extends DataSource {
  url: string;
  table: string;
}
