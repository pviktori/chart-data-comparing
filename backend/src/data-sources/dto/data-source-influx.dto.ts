import { DataSourceExtended } from './data-source.dto';

export interface DataSourceInflux extends DataSourceExtended {
  token: string;
  bucket: string;
  url: string;
  org: string;
}
