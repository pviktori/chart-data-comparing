import * as path from 'path';

export const TABLE_PREFIX = '__';
export const MIGRATION_TABLE_NAME = '__migrations';
export const MIGRATION_PATH = path.join(__dirname + '/migrations/*.{ts,js}');
