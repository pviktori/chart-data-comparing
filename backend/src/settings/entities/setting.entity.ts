import { Column, Entity, Generated, PrimaryColumn } from 'typeorm';
import { TABLE_PREFIX } from 'src/definitions';

@Entity(`${TABLE_PREFIX}setting_entity`)
export class SettingEntity {
  @PrimaryColumn({ type: 'char', length: 36 })
  @Generated('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  label!: string;

  @Column({ type: 'varchar' })
  key!: string;

  @Column({ type: 'varchar', length: 36 })
  value!: string;

  @Column({ type: 'text' })
  description!: string;
}
