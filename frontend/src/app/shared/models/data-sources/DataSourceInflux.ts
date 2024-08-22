import { DatabaseTypeEnum } from './Database';
import { DataSource } from './DataSource';

export interface DataSourceInflux extends DataSource {
  url: string;
  token: string;
  bucket: string;
  org: string;
  type: DatabaseTypeEnum.INFLUX;
}

export interface CreateDataSourceInflux extends Omit<DataSourceInflux, 'id'> {}
