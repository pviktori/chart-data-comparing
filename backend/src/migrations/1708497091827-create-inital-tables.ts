import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { TABLE_PREFIX } from '../definitions';

//define table names
const dataSourceInfluxTableName = `${TABLE_PREFIX}data_source_influx_entity`;
const sessionTableName = `${TABLE_PREFIX}session_entity`;
const settingsTableName = `${TABLE_PREFIX}setting_entity`;

export class CreateInitalTables1708497091827 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    //create Data Source Influx Entity table
    await queryRunner.createTable(
      new Table({
        name: dataSourceInfluxTableName,
        columns: [
          {
            name: 'id',
            type: 'char',
            length: '36',
            generationStrategy: 'uuid',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'type',
            length: '36',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'url',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'org',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'bucket',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'token',
            type: 'text',
            isNullable: false,
          },
        ],
        indices: [],
        uniques: [],
        foreignKeys: [],
      }),
    );

    //create SessionEntity table
    await queryRunner.createTable(
      new Table({
        name: sessionTableName,
        columns: [
          {
            name: 'id',
            type: 'char',
            length: '36',
            generationStrategy: 'uuid',
            isPrimary: true,
          },
          {
            name: 'data_source_id',
            type: 'char',
            length: '36',
            isNullable: false,
          }
          ,
          {
            name: 'dataset',
            type: 'char',
            length: '36',
          },
          {
            name: 'database_type',
            length: '36',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'features',
            type: 'json',
            isNullable: false,
          },

          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', isNullable: false },
          {
            name: 'data_timerange_start',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'data_timerange_stop',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'filters',
            type: 'json',
            isNullable: false,
          },
        ],
      }),
    );

    //create SettingEntity table
    await queryRunner.createTable(
      new Table({
        name: settingsTableName,
        columns: [
          {
            name: 'id',
            type: 'char',
            length: '36',
            generationStrategy: 'uuid',
            isPrimary: true,
          },
          {
            name: 'label',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'value',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'key',
            type: 'varchar',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
        ],
      }),
    );
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    //drop tables
    await queryRunner.dropTable(`${TABLE_PREFIX}session_entity`);
    await queryRunner.dropTable(`${TABLE_PREFIX}data_source_influx_entity`);
  }
}
