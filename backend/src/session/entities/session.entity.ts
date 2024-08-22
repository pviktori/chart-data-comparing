import { Column, Entity, Generated, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { TABLE_PREFIX } from 'src/definitions';
import { DatabaseType } from 'src/data-sources/dto';
import { SessionFilter } from '../dto';

@Entity(`${TABLE_PREFIX}session_entity`)
export class SessionEntity {
  @PrimaryColumn({ type: 'char', length: 36 })
  @Generated('uuid')
  id!: string;

  @Column({ type: 'char', length: 36 })
  dataSourceId!: string;

  @Column({ type: 'char', length: 36 })
  databaseType!: DatabaseType;

  @Column({ type: 'json', default: [] })
  features!: string[];

  @Column({ type: 'json', default: [] })
  filters!: SessionFilter[];

  @Column({ type: 'char',  length: 36 })
  dataset!: string;

  @Column({ type: 'datetime', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: string;

  @Column({ type: 'datetime' })
  dataTimerangeStart!: string | null;

  @Column({ type: 'datetime' })
  dataTimerangeStop!: string | null;

}
