import { HttpModule } from '@nestjs/axios';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourcesController } from './data-sources.controller';
import { DataSourcesService } from './services/data-sources.service';
import { DataSourcesInterfaceController } from './data-sources-interface.controller';
import { InfluxDBService } from './services/influxdb.service';
import { DataSourceInfluxEntity } from './entities';
import { SessionModule } from 'src/session/session.module';
import { DataJobModule } from 'src/data-job/data-job.module';
import { SettingsModule } from 'src/settings/settings.module';
import { DataSourcesInterfaceService } from './services';

@Module({
  imports: [
    TypeOrmModule.forFeature([DataSourceInfluxEntity]),
    HttpModule.registerAsync({
      useFactory: async () => ({
        timeout: 3 * 60 * 1000,
        maxRedirects: 5,
      }),
    }),
    forwardRef(() => SessionModule),
    DataJobModule,
    SettingsModule,
  ],
  controllers: [DataSourcesController, DataSourcesInterfaceController],
  providers: [DataSourcesService, InfluxDBService, DataSourcesInterfaceService],
  exports: [DataSourcesService, InfluxDBService, DataSourcesInterfaceService],
})
export class DataSourcesModule {}
