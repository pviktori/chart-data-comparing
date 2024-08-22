import { Column, Entity } from 'typeorm';
import { PRE_NAME_DATA_SOURCE_TABLE } from '../definitions';
import { DatabaseTypeEnum } from '../dto';
import { DataSourceEntity } from './data-source.entity';
import { TABLE_PREFIX } from 'src/definitions';

@Entity(`${TABLE_PREFIX}${PRE_NAME_DATA_SOURCE_TABLE}${DatabaseTypeEnum.INFLUX}_entity`)
export class DataSourceInfluxEntity extends DataSourceEntity {
  @Column({ type: 'text' })
  url!: string;

  @Column({ type: 'text' })
  token!: string;

  @Column({ type: 'char', length: 36 })
  bucket!: string;

  @Column({ type: 'char', length: 36 })
  org!: string;
}
