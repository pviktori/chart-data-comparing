import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSourceInfluxEntity } from '../entities';
import { InfluxDB, Point } from '@influxdata/influxdb-client';
import { createReadStream } from 'fs';
import * as csv from 'csv-parser';
import { SettingsService } from 'src/settings/settings.service';
import { MAX_DATA_POINTS_KEY } from 'src/settings/settings.constants';
import {
  ANNOTATION_TAG,
  ANNOTATIONS_DATASET,
  AnnotationDto,
  DataSourceInflux,
  DataSourceQueryParams,
} from '../dto';
import { SessionDto, SessionFilter } from 'src/session/dto';
import { dateToSeconds } from 'src/util';
import { DataSourceServiceInterface } from './data-source.abstract.service';
import { DeleteAPI } from '@influxdata/influxdb-client-apis';

const ERRORS_TABLE_STUB_POSTFIX = '_errors';

@Injectable()
export class InfluxDBService extends DataSourceServiceInterface<DataSourceInflux> {
  constructor(private _settingsService: SettingsService) {
    super();
  }
  async getData(
    dataSource: DataSourceInflux,
    session: SessionDto,
    dynamicProps: {
      queryErrors?: boolean;
      min?: number;
      max?: number;
      skipAggregate?: boolean;
    },
    page?: number,
    pageSize?: number,
  ) {
    const setting = await this._settingsService.findOneByKey(MAX_DATA_POINTS_KEY);
    const queryApi = new InfluxDB({ url: dataSource.url, token: dataSource.token }).getQueryApi(
      dataSource.org,
    );
    const sessionId = session.id;
    const queryProps = new DataSourceQueryParams<DataSourceInflux>({
      dataSource: dataSource,
      start: dateToSeconds(dynamicProps ? +dynamicProps.min : session.dataTimerangeStart),
      tables: dynamicProps?.queryErrors
        ? [session.dataset + ERRORS_TABLE_STUB_POSTFIX]
        : [session.dataset + ''],
      features: Array.from(new Set(session.features)),
      filters: session.filters,
      stop: dateToSeconds(dynamicProps ? +dynamicProps.max : session.dataTimerangeStop),
      sessionId,
      offset: page && pageSize ? (page - 1) * pageSize : undefined,
      limit: pageSize ? pageSize : undefined,
      maxPointCount: +setting?.value || undefined,
      useAggregation: !dynamicProps.skipAggregate,

      pivot: true,
    });

    const dataFluxQuery = await this._buildQuery(queryProps);
    const rows = [];
    const myQuery = async () => {
      for await (const { values, tableMeta } of queryApi.iterateRows(dataFluxQuery)) {
        const o = tableMeta.toObject(values);
        rows.push(o);
      }
    };
    await myQuery();
    const dataSets: { [key: string]: { x: string; y: number }[] } = {};
    session.features.forEach(element => {
      dataSets[element] = [];
    });
    rows.forEach(row => {
      session.features.forEach(f => {
        if (!Object.keys(row).includes(f)) return;
        dataSets[f].push({ y: row[f], x: row['_time'] });
      });
    });

    return dataSets;
  }

  async getTimeFrameOfMeasurement(dataSource: DataSourceInflux, measurement: string) {
    const lastUpdate = await this.getDatasetTimeFrame('last', dataSource, measurement);
    const firstUpdate = await this.getDatasetTimeFrame('first', dataSource, measurement);

    if (!lastUpdate || !firstUpdate) {
      throw new NotFoundException(
        'No the last or the first point was found in ' + measurement + ' measurement',
      );
    }

    // add extra 1 second to include last data point
    const stop = Math.floor(new Date(lastUpdate).getTime() + 1000);
    // add extra 1 second to include first data point
    const start = Math.floor(new Date(firstUpdate).getTime() - 1000);

    return {
      stop,
      start,
    };
  }

  async getDataCount(
    influxDetails: DataSourceInfluxEntity | DataSourceInflux,
    start: number,
    stop: number,
    measurement: string,
  ) {
    const { url, token, org } = influxDetails;
    const queryApi = new InfluxDB({ url, token }).getQueryApi(org);
    const query = [`from(bucket:"${influxDetails.bucket}")`];
    const startInSec = dateToSeconds(+start);
    const stopInSec = dateToSeconds(+stop);
    if (startInSec >= 0 && stopInSec) {
      query.push(`|> range(start: ${startInSec}, stop: ${stopInSec})`);
    } else {
      query.push(`|> range(start: ${startInSec})`);
    }
    query.push(`|> filter(fn:(r) => r._measurement == "${measurement}")`);
    query.push(`|> group(columns: ["_field"])`);
    query.push('|> count()');

    const result = {};
    const myQuery = async () => {
      for await (const { values, tableMeta } of queryApi.iterateRows(query.join(' '))) {
        const o = tableMeta.toObject(values);
        result[o['_field']] = o['_value'];
      }
    };
    await myQuery();
    return result;
  }

  async testConnection(influxDetails: DataSourceInflux) {
    try {
      const url: string = influxDetails.url;
      const token: string = influxDetails.token;
      const org: string = influxDetails.org;
      const influxDB = new InfluxDB({ url, token }).getQueryApi(org);
      const fluxQuery = `from(bucket: "${influxDetails.bucket}") |> range(start: 0) |> limit(n: 1)`;

      const response = await influxDB.collectRows(fluxQuery);
      return response.length > 0;
    } catch (error) {
      console.log('Error occurred while testing INFLUX connection! Details: ', error);
      return false;
    }
  }

  async getMeasurements(
    influxDetails: DataSourceInfluxEntity | DataSourceInflux,
  ): Promise<string[]> {
    const url: string = influxDetails.url;
    const token: string = influxDetails.token;
    const org: string = influxDetails.org;
    const queryApi = new InfluxDB({ url, token }).getQueryApi(org);
    const measurementsFluxQuery = `import "influxdata/influxdb/v1" v1.measurements(bucket: "${influxDetails.bucket}")`;

    const tables = [];
    const measurementsQuery = async () => {
      for await (const { values, tableMeta } of queryApi.iterateRows(measurementsFluxQuery)) {
        const o = tableMeta.toObject(values);
        if (o._value.endsWith('outliers') || o._value.endsWith('_errors')) continue;
        tables.push(o._value);
      }
    };
    await measurementsQuery();
    return tables;
  }

  async getFeatures(
    influxDetails: DataSourceInfluxEntity | DataSourceInflux,
    dataset: string,
  ): Promise<string[]> {
    const url: string = influxDetails.url;
    const token: string = influxDetails.token;
    const org: string = influxDetails.org;
    const queryApi = new InfluxDB({ url, token }).getQueryApi(org);
    return this._getFeaturesForMeasurement(queryApi, influxDetails.bucket, dataset);
  }

  /**
   * Retrieves the time frame of the dataset based on the specified point (first or last), measurement details, and InfluxDB data source.
   * @param point The point indicating whether to retrieve the first or last timestamp.
   * @param influxDetails The details of the InfluxDB data source.
   * @returns A Promise resolving to the timestamp of the specified point in the dataset, or null if no data is found.
   */
  async getDatasetTimeFrame(
    point: 'last' | 'first',
    influxDetails: DataSourceInfluxEntity | DataSourceInflux,
    measurement: string,
  ): Promise<string | null> {
    const { url, token, org } = influxDetails;
    const queryApi = new InfluxDB({ url, token }).getQueryApi(org);
    const queryProps = new DataSourceQueryParams<DataSourceInflux>({
      dataSource: influxDetails as DataSourceInflux,
      start: 0,
      stop: null,
      tables: [measurement],
      limitOrder: point === 'last' ? 'desc' : 'asc',
      limit: 1,
    });
    const dataFluxQuery = await this._buildQuery(queryProps);
    const result = {};
    const myQuery = async () => {
      for await (const { values, tableMeta } of queryApi.iterateRows(dataFluxQuery)) {
        const o = tableMeta.toObject(values);
        result[o['_field']] = o['_time'];
      }
    };
    await myQuery();
    return (Object.values(result)[0] as string) || null;
  }

  /**
   * Retrieves the fields of a measurement from an InfluxDB data source.
   * @param influxDetails The details of the InfluxDB data source.
   * @param measurement Optional. The measurement name for which to retrieve the fields.
   * @returns A Promise that resolves to an array of field names.
   */
  async getFields(influxDetails: DataSourceInfluxEntity | DataSourceInflux, measurement?: string) {
    const queryApi = new InfluxDB({
      url: influxDetails.url,
      token: influxDetails.token,
    }).getQueryApi(influxDetails.org);
    const query = `import "influxdata/influxdb/schema"
    schema.measurementFieldKeys(
      bucket: "${influxDetails.bucket}",
      measurement: "${measurement}",
      start: 0
    )`;
    const keys = [];

    const executeQuery = async () => {
      for await (const { values, tableMeta } of queryApi.iterateRows(query)) {
        const o = tableMeta.toObject(values);
        keys.push(o['_value']);
      }
    };

    await executeQuery();

    return keys;
  }

  /**
   * Retrieves the tags of a measurement from an InfluxDB data source.
   * @param influxDetails The details of the InfluxDB data source.
   * @param measurement Optional. The measurement name for which to retrieve the tags.
   * @returns A Promise that resolves to an array of tag names.
   */
  async getTags(influxDetails: DataSourceInfluxEntity | DataSourceInflux, measurement?: string) {
    const queryApi = new InfluxDB({
      url: influxDetails.url,
      token: influxDetails.token,
    }).getQueryApi(influxDetails.org);
    const query = `import "influxdata/influxdb/schema" \
      schema.measurementTagKeys(bucket: "${influxDetails.bucket}", measurement: "${measurement}", start:0)`;
    const tags = [];
    const executeQuery = async () => {
      for await (const { values, tableMeta } of queryApi.iterateRows(query)) {
        const o = tableMeta.toObject(values);
        tags.push(o['_value']);
      }
    };

    await executeQuery();

    return tags;
  }

  /**
   * Retrieves the features for a measurement from an InfluxDB data source.
   * @param queryApi The InfluxDB query API object.
   * @param bucket The name of the InfluxDB bucket.
   * @param measurement The name of the measurement for which to retrieve the features.
   * @returns A Promise that resolves to an array of feature names.
   */
  async _getFeaturesForMeasurement(
    queryApi: any,
    bucket: string,
    measurement: string,
  ): Promise<string[]> {
    const featuresFluxQuery = `from(bucket: "${bucket}") \
      |> range(start:0) \
      |> limit(n:1) \
      |> filter(fn:(r) => r._measurement == "${measurement}") \
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")`;
    const features: string[] = [];
    const featuresQuery = async () => {
      for await (const { values, tableMeta } of queryApi.iterateRows(featuresFluxQuery)) {
        const o = tableMeta.toObject(values);
        const badFeatures = ['result', 'table'];
        Object.keys(o).forEach(f => {
          if (!badFeatures.includes(f) && !f.startsWith('_')) {
            features.push(f);
          }
        });
      }
    };
    await featuresQuery();
    return features;
  }

  async uploadCSVToInfluxDB(
    influxDetails: DataSourceInflux,
    filePath: string,
    measurement: string,
  ): Promise<number> {
    const writeApi = new InfluxDB({
      url: influxDetails.url,
      token: influxDetails.token,
    }).getWriteApi(influxDetails.org, influxDetails.bucket);
    const points: Point[] = [];
    const errorPoints: Point[] = [];

    return new Promise((resolve, reject) => {
      createReadStream(filePath)
        .pipe(
          csv({
            separator: ',',
            skipComments: true,
          }),
        )
        .on('data', row => {
          const addErrorStub = Math.random() >= 0.95;
          const point = new Point(measurement);
          const errorPoint = new Point(measurement + ERRORS_TABLE_STUB_POSTFIX);
          if (row['_field'] && +row['_value'] && row['_time']) {
            point.floatField(row['_field'], +row['_value']).timestamp(new Date(row['_time']));
            if (addErrorStub)
              errorPoint
                .floatField(row['_field'], +row['_value'])
                .timestamp(new Date(row['_time']));
          } else {
            for (const [key, value] of Object.entries(row)) {
              if (!isNaN(Date.parse(value as string))) {
                point.timestamp(new Date(value as string));
                if (addErrorStub) errorPoint.timestamp(new Date(value as string));
              } else if (!isNaN(parseFloat(value as string))) {
                point.floatField(key, parseFloat(value as string));
                if (addErrorStub) errorPoint.floatField(key, parseFloat(value as string));
              } else {
                point.tag(key, value as any);
                if (addErrorStub) errorPoint.tag(key, value as any);
              }
            }
          }

          points.push(point);

          if (addErrorStub) errorPoints.push(errorPoint);
        })
        .on('end', async () => {
          try {
            if (points.length > 0) {
              writeApi.writePoints(points);
              writeApi.writePoints(errorPoints);
              await writeApi.close();
            }
            console.log('CSV data successfully uploaded to InfluxDB');
            resolve(points.length);
          } catch (error) {
            console.error('Error writing points to InfluxDB:', error);
            reject(error);
          }
        })
        .on('error', error => {
          console.error('Error reading CSV file:', error);
          reject(error);
        });
    });
  }

  async writeAnnotation(
    dataSource: DataSourceInflux,
    dataset: string,
    timestamp: number,
    label: string,
  ): Promise<AnnotationDto> {
    const startTimestamp = new Date(+timestamp - 1).toISOString();
    const stopTimestamp = new Date(+timestamp + 1).toISOString();
    const influxDB = new InfluxDB({
      url: dataSource.url,
      token: dataSource.token,
    });
    const writeApi = influxDB.getWriteApi(dataSource.org, dataSource.bucket);

    const query = `from(bucket: "${dataSource.bucket}")
    |> range(start: ${startTimestamp}, stop: ${stopTimestamp})
    |> filter(fn: (r) => r._measurement == "${dataset}")`;

    const existingPoints = (await new InfluxDB({
      url: dataSource.url,
      token: dataSource.token,
    })
      .getQueryApi(dataSource.org)
      .collectRows(query)) as {
      _value: number;
      _field: string;
      _measurement: string;
      _time: string;
    }[];

    existingPoints.forEach(pointData => {
      {
        const point = new Point(ANNOTATIONS_DATASET)
          .floatField(pointData._field, pointData._value)
          .tag(ANNOTATION_TAG, label)
          .tag('dataset', dataset)
          .timestamp(new Date(pointData._time));

        writeApi.writePoint(point);
      }
    });

    await writeApi.close();

    return {
      time: timestamp,
      [ANNOTATION_TAG]: label,
    };
  }

  async readAnnotations(
    dataSource: DataSourceInflux,
    dataset: string,
    startTime: number,
    stopTime: number,
  ): Promise<AnnotationDto[]> {
    const queryApi = new InfluxDB({
      url: dataSource.url,
      token: dataSource.token,
    }).getQueryApi(dataSource.org);

    const query = `from(bucket: "${dataSource.bucket}")
      |> range(start: ${dateToSeconds(+startTime)}, stop: ${dateToSeconds(+stopTime)})
      |> filter(fn: (r) => r._measurement == "${ANNOTATIONS_DATASET}")
      |> filter(fn: (r) => r.dataset == "${dataset}")
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")`;
    const data = await queryApi.collectRows(query);
    return data.map((item: any) => ({
      time: new Date(item['_time']).getTime(),
      [ANNOTATION_TAG]: item[ANNOTATION_TAG],
    }));
  }

  async deleteAnnotation(
    dataSource: DataSourceInflux,
    dataset: string,
    timestamp: number,
    label: string,
  ): Promise<void> {
    const influxDB = new InfluxDB({
      url: dataSource.url,
      token: dataSource.token,
    });
    const deleteApi = new DeleteAPI(influxDB);
    const start = new Date(timestamp).toISOString();
    const stop = new Date(new Date(timestamp).getTime() + 1).toISOString(); // Assuming you want to delete exactly at the timestamp

    await deleteApi.postDelete({
      body: {
        predicate: `_measurement="${ANNOTATIONS_DATASET}" AND dataset="${dataset}" AND ${ANNOTATION_TAG}="${label}"`,
        start,
        stop,
      },
      bucket: dataSource.bucket,
      org: dataSource.org,
    });
  }

  async deleteAnnotationsByLabel(
    dataSource: DataSourceInflux,
    dataset: string,
    annotationTags: string[],
    startTime: number,
    stopTime: number,
  ) {
    const influxDB = new InfluxDB({
      url: dataSource.url,
      token: dataSource.token,
    });
    const deleteApi = new DeleteAPI(influxDB);

    await Promise.all(
      annotationTags.map(tag =>
        deleteApi.postDelete({
          body: {
            predicate: `_measurement="${ANNOTATIONS_DATASET}" AND ${ANNOTATION_TAG}="${tag}" AND dataset="${dataset}"`,
            start: new Date(+startTime).toISOString(),
            stop: new Date(+stopTime).toISOString(),
          },
          bucket: dataSource.bucket,
          org: dataSource.org,
        }),
      ),
    );
  }

  private async _buildQuery({
    dataSource,
    start,
    tables,
    stop,
    filters,
    features,
    limit,
    limitOrder,
    useAggregation,
    sessionId,
    offset,
    specificParams,
    maxPointCount,
  }: DataSourceQueryParams<DataSourceInflux>): Promise<string> {
    const isAnomalies = !!specificParams.queryErrors;
    let finalWindowQuery = specificParams.windowQuery || '',
      tagValuesFilter = '',
      fieldValuesFilter = '',
      sessionIdQuery = '';

    if (useAggregation && !finalWindowQuery) {
      [tagValuesFilter, fieldValuesFilter] = this._filterToFlux(
        await this._addFieldOrTagInformation(dataSource, filters, tables[0]),
      );
      const windowSize = Math.round((stop - start) / (maxPointCount / features.length));
      finalWindowQuery = `|> aggregateWindow(every: ${windowSize > 0 ? windowSize : 1}s, fn: mean)`;
    }

    if (isAnomalies) {
      sessionIdQuery = `|> filter(fn: (r) => r["sessionID"] == "${sessionId || 'no session'}")`;
    }

    const rangeFilter =
      stop !== null ? `range(start: ${start}, stop: ${stop})` : `range(start: ${start})`;
    const measurementsFilter =
      `|> filter(fn:(r) => ` +
      tables.map(table => `r._measurement == "${table}"`).join(' or ') +
      ')';
    const fieldsFilter =
      features.length !== 0
        ? `|> filter(fn: (r) => ${features
            .map(feature => `r._field == "${feature}"`)
            .join(' or ')})`
        : '';

    const limitStatement =
      typeof limit === 'number'
        ? ` |> sort(columns: ["_time"], desc: ${
            limitOrder === 'desc'
          }) |> limit(n:${limit}, offset: ${offset ?? 0})`
        : '';

    const pivotColumnKey = '_field';
    const pivotStatement = specificParams.pivot
      ? '|> pivot(rowKey:["_time"], columnKey: ["' + pivotColumnKey + '"], valueColumn: "_value")'
      : '';

    const featuresFormatted = [...(specificParams.pivot ? features : ['_value']), '_time']
      .map(feature => `"${feature}"`)
      .join(', ');
    const keepStatement = features.length !== 0 ? `|> keep(columns: [${featuresFormatted}])` : '';
    const query =
      `from(bucket:"${dataSource.bucket}") ` +
      `|> ${rangeFilter} ${measurementsFilter} ` +
      `${sessionIdQuery} ${tagValuesFilter} ${fieldsFilter} ` +
      `${finalWindowQuery} ${pivotStatement} ${fieldValuesFilter} ` +
      `${limitStatement} ${keepStatement}`;

    return query;
  }

  /**
   * Converts a list of filters into InfluxDB Flux filter expressions.
   * @param filters A list of filters
   * @returns A tuple of two strings representing the Flux filter expressions for tags and fields, respectively.
   */
  private _filterToFlux(filters: SessionFilter[]) {
    const filterTemplate = 'r["${feature}"] ${operator} ${value}';
    const filterPrefix = '|> filter(fn: (r) => ';
    const tagFilters = [];
    const fieldFilters = [];

    filters.forEach(filter => {
      // if operator is in or not in, verify that list of values only contains either numbers or strings
      if (['in', 'not in'].includes(filter.operator)) {
        const numNumbers = (filter.value as number[]).reduce(
          (acc, val) => acc + (Number.isNaN(+val) ? 0 : 1),
          0,
        );

        if (numNumbers === (filter.value as (number | string)[]).length) {
          // values are numbers but they need to be strings for the query
          filter.value = (filter.value as (number | string)[]).map(val => String(val));
        } else if (numNumbers === 0) {
          // wrap values in quotes (explicit strings), because they are meant as strings
          filter.value = (filter.value as (number | string)[]).map(val => `"${val}"`);
        } else {
          throw new Error(
            "List of values for operators 'in' and 'not in' can only be strings OR numbers, but not mixed.",
          );
        }
      } else {
        // if operator is equals, not equals or one of <,>,<=,>=
        if (['equals', 'not equals'].includes(filter.operator)) {
          filter.operator = filter.operator === 'equals' ? '==' : '!=';
        }

        // if value is a string, add explicit quotes for query
        if (Number.isNaN(+filter.value)) {
          filter.value = `"${filter.value}"`;
        } else {
          // if value is number add explicit float typecast
          filter.value = parseFloat(filter.value as string);
        }
      }

      // "in" and "not in" filters require special syntax
      let filterStr;
      if (['in', 'not in'].includes(filter.operator)) {
        filterStr = `${filter.operator === 'not in' ? 'not ' : ''}contains(value: r.${
          filter.feature
        }, set: [${(filter.value as number[]).join(', ')}])`;
      } else {
        filterStr = filterTemplate
          .replace('${feature}', filter.feature)
          .replace('${operator}', filter.operator)
          .replace('${value}', filter.value as string);
      }

      if (filter.type === 'tag') {
        tagFilters.push(filterStr);
      } else {
        fieldFilters.push(filterStr);
      }
    });

    const tagFiltersStr = tagFilters.length ? filterPrefix + tagFilters.join(' and ') + ')' : '';
    const fieldFiltersStr = fieldFilters.length
      ? filterPrefix + fieldFilters.join(' and ') + ')'
      : '';

    return [tagFiltersStr, fieldFiltersStr];
  }

  /**
   * Adds field or tag information to the filters.
   * @param influxDetails Data Source Configurations
   * @param filters A list of dictionaries representing the filters.
   * @returns A list of dictionaries representing the filters with added 'type' information.
   * @throws Error: If the feature is not found in fields or tags.
   */
  private async _addFieldOrTagInformation(
    influxDetails: DataSourceInfluxEntity | DataSourceInflux,
    filters: SessionFilter[],
    measurement: string,
  ): Promise<SessionFilter[]> {
    try {
      const fields = await this.getFields(influxDetails, measurement);
      const tags = await this.getTags(influxDetails, measurement);

      for (const filter of filters) {
        const feature = filter.feature;

        if (fields.includes(feature)) {
          filter.type = 'field';
        } else if (tags.includes(feature)) {
          filter.type = 'tag';
        } else {
          throw new Error(`Feature ${feature} not found in fields or tags.`);
        }
      }

      return filters;
    } catch (error) {
      throw error;
    }
  }
}
