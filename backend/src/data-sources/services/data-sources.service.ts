import { Injectable, NotFoundException, NotImplementedException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { PRE_NAME_DATA_SOURCE_TABLE } from '../definitions';
import {
  CreateDataSourceExtended,
  DATABASES,
  DatabaseType,
  DatabaseTypeEnum,
  DataSourceExtended,
  DataSourceInflux,
} from '../dto';
import { TABLE_PREFIX } from 'src/definitions';
import { InfluxDBService } from './influxdb.service';
import { SessionService } from 'src/session/session.service';
import { DataJobService } from 'src/data-job/data-job.service';
import { DataJobStatusTypeEnum } from 'src/data-job/dto';

@Injectable()
export class DataSourcesService {
  constructor(
    @InjectDataSource() private _dataSource: DataSource,
    private _influxDBService: InfluxDBService,
    private _sessionService: SessionService,
    private _dataJobService: DataJobService,
  ) {}

  /**
   * Retrieves data sources for a given tenant, grouped by database type.
   * @returns A Promise resolving to an object containing data sources grouped by database type.
   */
  async getDateSources(): Promise<{
    [key in DatabaseType]?: DataSourceExtended[];
  }> {
    const result: {
      [key in DatabaseType]?: DataSourceExtended[];
    } = {};
    await Promise.all(
      DATABASES.map(async type => {
        result[type] = await this._getRepository<DataSourceExtended>(type).find();
      }),
    );
    return result;
  }

  /**
   * Retrieves a data source by ID and type for a given tenant.
   * @param id The ID of the data source.
   * @param type The type of the database.
   * @returns A Promise resolving to the data source.
   * @throws NotFoundException if the data source is not found.
   */
  async getDataSourceById<T extends DataSourceExtended = DataSourceExtended>(
    id: string,
    type: DatabaseType,
  ): Promise<T> {
    let result: T | undefined;
    try {
      result = await this._getRepository<T>(type).findOne({
        where: { id } as FindOptionsWhere<T>,
      });
      return result;
    } catch (e) {
      throw new NotFoundException('Data Source is not found.');
    }
  }

  /**
   * Updates a data source by ID and type for a given tenant.
   * @param id The ID of the data source.
   * @param type The type of the database.
   * @param dto The partial data source details to update.
   * @returns A Promise resolving to the updated data source.
   * @throws NotFoundException if the data source is not found.
   */
  async updateDataSource<T extends DataSourceExtended = DataSourceExtended>(
    id: string,
    type: DatabaseType,
    dto: Partial<CreateDataSourceExtended>,
  ): Promise<T> {
    const dataSource = await this.getDataSourceById<T>(id, type);
    await this._getRepository(type).update(id, { ...dto, type });

    return { ...dataSource, ...dto, type } as T;
  }

  /**
   * Creates a new data source for a given tenant.
   * @param type The type of the database.
   * @param dto The data source details to create.
   * @returns A Promise resolving to the created data source.
   */
  async createDataSource<T extends DataSourceExtended = DataSourceExtended>(
    type: DatabaseType,
    dto: CreateDataSourceExtended,
  ) {
    const dataSource = await this._getRepository<T>(type).save({ ...dto, type } as T);
    return dataSource;
  }

  /**
   * Tests the connection to the database for the specified data source.
   * @param type The type of the database.
   * @param dto The data source details used for testing the connection.
   * @returns A Promise resolving to a boolean value indicating whether the connection test was successful.
   * @throws Error if the database type is not implemented.
   */
  testConnection(type: DatabaseType, dto: CreateDataSourceExtended): Promise<boolean> {
    switch (type) {
      case DatabaseTypeEnum.INFLUX:
        return this._influxDBService.testConnection(dto as DataSourceInflux);

      default:
        throw new Error('Not implemented');
    }
  }

  /**
   * Deletes a data source by ID and type for a given tenant.
   * @param id The ID of the data source to delete.
   * @param type The type of the database.
   * @returns A Promise resolving to a boolean value indicating whether the deletion was successful.
   */
  async deleteDataSource<T extends DataSourceExtended = DataSourceExtended>(
    id: string,
    type: DatabaseType,
  ) {
    const result = await this._getRepository<T>(type).delete({
      id,
    } as FindOptionsWhere<T>);
    return !!result;
  }

  /**
   * Retrieves data from the specified data source for a given session and query parameters.
   * @param id The ID of the data source.
   * @param type The type of the database.
   * @param sessionId The ID of the session.
   * @param query Optional query parameters including start and stop timestamps.
   * @returns A Promise resolving to the retrieved data from the data source.
   * @throws NotImplementedException if the database type is not implemented.
   */
  async getDataSourceData(
    id: string,
    type: DatabaseType,
    sessionId: string,
    query: {
      start?: number;
      stop?: number;
      page?: number;
      skipAggregate?: boolean;
      pageSize?: number;
    },
  ) {
    const session = await this._sessionService.getSession(sessionId);

    switch (type) {
      case DatabaseTypeEnum.INFLUX: {
        const dataSource = await this.getDataSourceById<DataSourceInflux>(id, type);
        const data = await this._influxDBService.getData(
          dataSource,
          session,
          {
            max: +query.stop || +session.dataTimerangeStop,
            min: +query.start || +session.dataTimerangeStart,
            skipAggregate: query.skipAggregate,
          },
          query.page,
          query.pageSize,
        );

        return data;
      }

      default:
        throw new NotImplementedException();
    }
  }

  /**
   * Retrieves anomalies from the specified data source for a given session and query parameters.
   * @param id The ID of the data source.
   * @param type The type of the database.
   * @param sessionId The ID of the session.
   * @param query Optional query parameters including start and stop timestamps.
   * @returns A Promise resolving to the retrieved anomalies data from the data source.
   * @throws NotImplementedException if the database type is not implemented.
   */
  async getDataSourceAnomaliesData(
    id: string,
    type: DatabaseType,
    sessionId: string,
    query: {
      start: number;
      stop: number;
      page?: number;
      pageSize?: number;
      skipAggregate?: boolean;
    },
  ) {
    const session = await this._sessionService.getSession(sessionId);
    switch (type) {
      case DatabaseTypeEnum.INFLUX: {
        const dataSource = await this.getDataSourceById<DataSourceInflux>(id, type);
        const data = await this._influxDBService.getData(
          dataSource,
          session,
          {
            max: +query.stop || +session.dataTimerangeStop,
            min: +query.start || +session.dataTimerangeStart,
            queryErrors: true,
            skipAggregate: query.skipAggregate,
          },
          query.page,
          query.pageSize,
        );

        return data;
      }
      default:
        throw new NotImplementedException();
    }
  }

  async processGetDataSourceDataReq(params: {
    dataSourceId: string;
    dbType: DatabaseType;
    sessionId: string;
    start: number;
    stop: number;
    queryErrors: boolean;
    skipAggregate?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    this._dataJobService.createJob(params.sessionId);
    let data;
    try {
      console.log(params);

      data = params.queryErrors
        ? await this.getDataSourceAnomaliesData(
            params.dataSourceId,
            params.dbType,
            params.sessionId,
            {
              start: params.start,
              stop: params.stop,
              page: params.page ? Number(params.page) : undefined,
              pageSize: params.pageSize ? Number(params.pageSize) : undefined,
            },
          )
        : await this.getDataSourceData(params.dataSourceId, params.dbType, params.sessionId, {
            start: params.start,
            stop: params.stop,
            page: params.page ? Number(params.page) : undefined,
            pageSize: params.pageSize ? Number(params.pageSize) : undefined,
            skipAggregate: params.skipAggregate,
          });

      this._dataJobService.setStatus(params.sessionId, DataJobStatusTypeEnum.COMPLETE, data);
    } catch (error) {
      this._dataJobService.setStatus(
        params.sessionId,
        DataJobStatusTypeEnum.ERROR,
        undefined,
        error,
      );
    }
  }

  /**
   * Retrieves the available time frame of a dataset from the specified data source.
   * @param id The ID of the data source.
   * @param type The type of the database.
   * @param dataset The name of the dataset.
   * @returns A Promise resolving to an object containing the start and stop timestamps of the dataset's time frame.
   * @throws NotImplementedException if the database type is not implemented.
   */
  async getAvailableDatasetTimeFrame(id: string, type: DatabaseType, dataset: string) {
    switch (type) {
      case DatabaseTypeEnum.INFLUX: {
        const dataSource = await this.getDataSourceById<DataSourceInflux>(id, type);
        const { start, stop } = await this._influxDBService.getTimeFrameOfMeasurement(
          dataSource,
          dataset,
        );

        return {
          start,
          stop,
        };
      }

      default:
        throw new NotImplementedException();
    }
  }

  /**
   * Retrieves the fields and tags of a dataset from the specified data source.
   * @param id The ID of the data source.
   * @param type The type of the database.
   * @param dataset The name of the dataset.
   * @returns A Promise resolving to an object containing the fields and tags of the dataset.
   * @throws NotImplementedException if the database type is not implemented.
   */
  async getTagsAndFields(
    id: string,
    type: DatabaseType,
    dataset: string,
  ): Promise<{
    fields: string[];
  }> {
    switch (type) {
      case DatabaseTypeEnum.INFLUX: {
        const dataSource = await this.getDataSourceById<DataSourceInflux>(id, type);
        const fields = await this._influxDBService.getFields(dataSource, dataset);

        return {
          fields,
        };
      }

      default:
        throw new NotImplementedException();
    }
  }

  async uploadCSVToDataSource(
    id: string,
    type: DatabaseType,
    filePath: string,
    measurement: string,
  ) {
    const dataSource = await this.getDataSourceById(id, type);
    switch (type) {
      case DatabaseTypeEnum.INFLUX: {
        const result = await this._influxDBService.uploadCSVToInfluxDB(
          dataSource as DataSourceInflux,
          filePath,
          measurement,
        );
        return result;
      }
      default:
        throw new NotImplementedException();
    }
  }

  /**
   * Retrieves the count of anomalies for session from an InfluxDB data source.
   * @param influxDB The InfluxDB data source.
   * @param params An object containing parameters including session ID, start time, and stop time.
   * @returns A Promise that resolves to the count of anomalies.
   */
  private async _getInfluxAnomaliesCountPer(
    influxDB: DataSourceInflux,
    params: { sessionId: string; startInSec: number; stopInSec: number },
  ): Promise<number> {
    let count = 0;
    try {
      count =
        (Object.values(
          await this._influxDBService.getDataCount(
            influxDB,
            params.startInSec,
            params.stopInSec,
            'anomalies',
          ),
        )[0] as number) || 0;
    } catch (error) {
      count = 0;
      console.log(`No anomalies for (sessionId: ${params['id']}) for period`);
    }

    return count;
  }

  /**
   * Retrieves the repository for a specific data source type.
   * @param type The type of the database.
   * @returns The repository for the specified data source type.
   */
  private _getRepository<T extends DataSourceExtended = DataSourceExtended>(
    type: DatabaseType,
  ): Repository<T> {
    return this._dataSource.getRepository<T>(
      `${TABLE_PREFIX}${PRE_NAME_DATA_SOURCE_TABLE}${type}_entity`,
    );
  }
}
