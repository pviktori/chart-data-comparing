import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { SettingEntity } from './entities';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([SettingEntity])],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService]
})
export class SettingsModule {}
