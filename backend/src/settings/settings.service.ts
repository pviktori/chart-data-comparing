import { Injectable } from '@nestjs/common';
import { SettingEntity } from './entities';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSettingDto } from './dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SettingEntity)
    private settingsRepository: Repository<SettingEntity>,
  ) {}

  create(createSettingDto: CreateSettingDto): Promise<SettingEntity> {
    const setting = this.settingsRepository.create({ ...createSettingDto });
    return this.settingsRepository.save(setting);
  }

  findAll(): Promise<SettingEntity[]> {
    return this.settingsRepository.find({ where: {} });
  }

  findOne(id: string): Promise<SettingEntity> {
    return this.settingsRepository.findOne({ where: { id } });
  }

  findOneByKey(key: string): Promise<SettingEntity> {
    return this.settingsRepository.findOne({ where: { key } });
  }

  async update(id: string, updateSettingDto: Partial<CreateSettingDto>): Promise<SettingEntity> {
    await this.settingsRepository.update({ id }, updateSettingDto);
    return this.settingsRepository.findOne({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    await this.settingsRepository.delete({ id });
  }
}
