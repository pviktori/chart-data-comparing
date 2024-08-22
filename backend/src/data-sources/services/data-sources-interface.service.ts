import { Inject, Injectable, NotImplementedException, forwardRef } from '@nestjs/common';
import { InfluxDBService } from './influxdb.service';
import { DatabaseType, DatabaseTypeEnum } from '../dto';
import { DataSourcesService } from './data-sources.service';

@Injectable()
export class DataSourcesInterfaceService {
  constructor(
    @Inject(forwardRef(() => DataSourcesService))
    private _dataSourcesService: DataSourcesService,
    private _influxDBService: InfluxDBService,
  ) {}

  async createAnnotation(
    dataSourceId: string,
    dataSourceType: DatabaseType,
    dataset: string,
    timestamp: number,
    label: string,
  ) {
    const dataSource = await this._dataSourcesService.getDataSourceById(
      dataSourceId,
      dataSourceType,
    );
    const service = this._getService(dataSource.type);
    return service.writeAnnotation(dataSource as any, dataset, timestamp, label);
  }

  async deleteAnnotation(
    dataSourceId: string,
    dataSourceType: DatabaseType,
    dataset: string,
    timestamp: number,
    label: string,
  ) {
    const dataSource = await this._dataSourcesService.getDataSourceById(
      dataSourceId,
      dataSourceType,
    );
    const service = this._getService(dataSource.type);
    return service.deleteAnnotation(dataSource as any, dataset, timestamp, label);
  }

  async getAnnotations(
    dataSourceId: string,
    dataSourceType: DatabaseType,
    dataset: string,
    startTime: number,
    stopTime: number,
  ) {
    const dataSource = await this._dataSourcesService.getDataSourceById(
      dataSourceId,
      dataSourceType,
    );
    const service = this._getService(dataSource.type);
    return service.readAnnotations(dataSource as any, dataset, startTime, stopTime);
  }

  async deleteAnnotationsByLabel(
    dataSourceId: string,
    dataSourceType: DatabaseType,
    dataset: string,
    annotationTags: string[],
    startTime: number,
    stopTime: number,
  ) {
    const dataSource = await this._dataSourcesService.getDataSourceById(
      dataSourceId,
      dataSourceType,
    );
    const service = this._getService(dataSource.type);
    return service.deleteAnnotationsByLabel(
      dataSource as any,
      dataset,
      annotationTags,
      startTime,
      stopTime,
    );
  }

  private _getService(dataSourceType: DatabaseType) {
    switch (dataSourceType) {
      case DatabaseTypeEnum.INFLUX:
        return this._influxDBService;
      default:
        throw new NotImplementedException('Unsupported data source');
    }
  }
}
