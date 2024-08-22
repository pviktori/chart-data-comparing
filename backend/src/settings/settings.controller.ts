import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto';
import { MAX_DATA_POINTS_KEY, MAX_DATA_POINTS_VALUE } from './settings.constants';

@Controller('settings')
export class SettingsController {
  constructor(private _settingsService: SettingsService) {}

  @Post()
  create(@Body() createSettingDto: CreateSettingDto) {
    return this._settingsService.create(createSettingDto);
  }

  @Get()
  async findAll() {
    const settings = await this._settingsService.findAll();

    if (!settings.length) {
      // fill Settings table with initial values
      settings.push(
        await this._settingsService.create({
          label: 'Chart Max. Data Points',
          value: MAX_DATA_POINTS_VALUE + '',
          key: MAX_DATA_POINTS_KEY,
          description:
            'Set the maximum number of data points displayed in all time series charts. A higher value enhances chart detail but may lead to longer loading times. The default setting is 1,000 points.',
        }),
      );
    }
    return settings;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this._settingsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateSettingDto: Partial<CreateSettingDto>) {
    return this._settingsService.update(id, updateSettingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this._settingsService.remove(id);
  }
}
