export const DATABASES = ['influx'] as const;
export type DatabaseType = (typeof DATABASES)[number];

export enum DatabaseTypeEnum {
  INFLUX = 'influx',
  EMPTY = '',
}
