import { Column, Generated, PrimaryColumn } from 'typeorm';
import { DatabaseType } from '../dto';

export class DataSourceEntity {
  @PrimaryColumn({ type: 'char', length: 36 })
  @Generated('uuid')
  id!: string;

  @Column({ type: 'char', length: 36 })
  name!: string;

  @Column({ type: 'char', length: 36 })
  type!: DatabaseType;
}
