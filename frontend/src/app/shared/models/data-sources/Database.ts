export const DATABASES = ['influx', ''] as const;
export type DatabaseUnit = (typeof DATABASES)[number];

export const DATABASE_CATEGORIES = [ 'loggingDocument'] as const;
export type DatabaseCategoryUnit = (typeof DATABASE_CATEGORIES)[number];

export enum DatabaseTypeEnum {
  INFLUX = 'influx',
  EMPTY = '',
}

export const DatabaseNames = {
  [DatabaseTypeEnum.INFLUX]: 'Influx DB',
};

export interface DatabaseInfo {
  type: DatabaseUnit;
  name: string;
  description: string;
}

export type DatabasesInfo = {
  [key in DatabaseCategoryUnit]?: DatabaseInfo[];
};

export interface DatabaseConfig {
  type: string;
  default: string;
  validators?: string[];
  formFieldType?: string;
  list?: string[];
  inputType?: 'password' | 'number';
}

export type DatabaseConfigs = {
  [key in DatabaseUnit]?: { [key: string]: DatabaseConfig };
};
