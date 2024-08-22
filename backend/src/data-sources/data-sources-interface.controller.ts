import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { DataSourcesService } from './services/data-sources.service';
import { InfluxDBService } from './services/influxdb.service';
import { DataSourceInflux, DatabaseType, DatabaseTypeEnum } from './dto';
import { extname } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';

import { DataSourcesInterfaceService } from './services';
// specifies the number of points that are shown in the chart at any given time (excluding outliers)
// expose parameter for configuration in a file

@Controller('data-sources-details')
export class DataSourcesInterfaceController {
  constructor(
    private _influxDBService: InfluxDBService,
    private _dataSourcesService: DataSourcesService,
    private _dataSourcesInterfaceService: DataSourcesInterfaceService,
  ) {}

  @Get(':dbType/:id/tables')
  async getMeasurements(@Param('id') id: string, @Param('dbType') dbType: string) {
    let result;
    switch (dbType) {
      case DatabaseTypeEnum.INFLUX:
        const influxDB = await this._dataSourcesService.getDataSourceById<DataSourceInflux>(
          id,
          dbType,
        );
        result = await this._influxDBService.getMeasurements(influxDB);
        break;

      default:
        throw RangeError(`No valid interface for dbType:${dbType} found.`);
    }
    return result;
  }

  @Get(':dbType/:id/:dataSetId/features')
  async getFeatures(
    @Param('id') id: string,
    @Param('dbType') dbType: DatabaseType,
    @Param('dataSetId') dataSetId: string,
  ) {
    const dataSource = await this._dataSourcesService.getDataSourceById(id, dbType);
    switch (dbType) {
      case DatabaseTypeEnum.INFLUX: {
        return this._influxDBService.getFeatures(dataSource as DataSourceInflux, dataSetId);
      }

      default:
        throw RangeError(`No valid interface for dbType:${dbType} found.`);
    }
  }

  @Get(':dbType/:id/:sessionId/data')
  async getData(
    @Param('id') id: string,
    @Param('dbType') dbType: DatabaseType,
    @Param('sessionId') sessionId: string,
    @Query('start') start: number,
    @Query('stop') stop: number,
    @Query('queryErrors') queryErrors: number,
    @Query('skipAggregate') skipAggregate: number,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    this._dataSourcesService.processGetDataSourceDataReq({
      dataSourceId: id,
      dbType,
      sessionId,
      start,
      stop,
      queryErrors: !!Number(queryErrors),
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      skipAggregate: !!Number(skipAggregate),
    });
    return { message: 'process started' };
  }

  @Get(':dbType/:id/available-time-frame')
  async getAvailableDatasetTimeFrame(
    @Param('id') id: string,
    @Param('dbType') dbType: DatabaseType,
    @Query('dataset') dataset: string,
  ) {
    return this._dataSourcesService.getAvailableDatasetTimeFrame(id, dbType, dataset);
  }

  @Get(':type/:id/fields-and-tags')
  getFieldsAndTags(
    @Param('type') type: DatabaseType,
    @Param('id') id: string,
    @Query('dataset') dataset: string,
  ): Promise<{
    fields: string[];
  }> {
    return this._dataSourcesService.getTagsAndFields(id, type, dataset);
  }

  @Get(':dbType/:id/count')
  async getDataCount(
    @Query('start') start: number,
    @Query('stop') stop: number,
    @Query('table') table: string,
    @Param('id') id: string,
    @Param('dbType') dbType: string,
  ) {
    if (dbType == 'influx') {
      const influxDB = await this._dataSourcesService.getDataSourceById<DataSourceInflux>(
        id,
        dbType,
      );
      const dataCount = await this._influxDBService.getDataCount(influxDB, start, stop, table);
      return dataCount;
    } else {
      throw RangeError(`No valid interface for dbType:${dbType} found.`);
    }
  }

  @Post(':type/:id/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now();
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
      fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'text/csv' && extname(file.originalname).toLowerCase() !== '.csv') {
          return cb(new BadRequestException('Only .csv files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadCSV(
    @Param('id') id: string,
    @Param('type') type: DatabaseType,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    try {
      const result = await this._dataSourcesService.uploadCSVToDataSource(
        id,
        type,
        file.path,
        file.originalname.split('.')[0],
      );
      fs.unlinkSync(file.path);
      return { message: 'CSV data successfully uploaded to InfluxDB', count: result };
    } catch (error) {
      fs.unlinkSync(file.path);
      return { message: 'Error uploading CSV', error: error.message };
    }
  }

  @Post(':dbType/:id/annotate')
  async createAnnotation(
    @Body()
    createAnnotationDto: {
      dataset: string;
      timestamp: number;
      label: string;
    },

    @Param('id') id: string,
    @Param('dbType') dbType: DatabaseType,
  ) {
    return this._dataSourcesInterfaceService.createAnnotation(
      id,
      dbType,
      createAnnotationDto.dataset,
      createAnnotationDto.timestamp,
      createAnnotationDto.label,
    );
  }

  @Delete(':dbType/:id/annotations')
  async deleteAnnotation(
    @Param('id') id: string,
    @Param('dbType') dbType: DatabaseType,
    @Query('dataset') dataset: string,
    @Query('timestamp') timestamp: number,
    @Query('label') label: string,
  ) {
    return this._dataSourcesInterfaceService.deleteAnnotation(
      id,
      dbType,
      dataset,
      +timestamp,
      label,
    );
  }

  @Delete(':dbType/:id/annotations/timeframe')
  async deleteAnnotationsByLabel(
    @Param('id') id: string,
    @Param('dbType') dbType: DatabaseType,
    @Query('dataset') dataset: string,
    @Query('labels') labels: string[],
    @Query('start') start: number,
    @Query('stop') stop: number,
  ) {
    return this._dataSourcesInterfaceService.deleteAnnotationsByLabel(
      id,
      dbType,
      dataset,
      Array.isArray(labels) ? labels : [labels],
      start,
      stop,
    );
  }

  @Get(':dbType/:id/annotations')
  async getAnnotations(
    @Param('id') id: string,
    @Param('dbType') dbType: DatabaseType,
    @Query('dataset') dataset: string,
    @Query('start') start: number,
    @Query('stop') stop: number,
  ) {
    return this._dataSourcesInterfaceService.getAnnotations(id, dbType, dataset, start, stop);
  }
}
