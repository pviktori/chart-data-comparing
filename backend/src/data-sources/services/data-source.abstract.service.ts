import { SessionDto } from 'src/session/dto';
import { AnnotationDto, DataSourceData, DataSourceExtended } from '../dto';

/**
 * Abstract class representing a data source service.
 * This class should be extended by any service that interacts with a specific data source.
 */
export abstract class DataSourceServiceInterface<T extends DataSourceExtended> {
  /**
   * Retrieves data from an data source based on the provided session and dynamic properties.
   * @param dataSource The data source configuration.
   * @param session The session DTO containing session information.
   * @param dynamicProps Additional dynamic properties for customizing the query (optional).
   *   - queryErrors: Query errors(optional).
   *   - min: The minimum value for the query (optional).
   *   - max: The maximum value for the query (optional).
   * @returns Array of requested data from data source in point format {x, y}, where x - date string, y - value.
   */
  abstract getData(
    dataSource: T,
    session: SessionDto,
    dynamicProps: {
      queryErrors?: boolean;
      min?: number;
      max?: number;
    },
  ): Promise<{ [key: string]: { x: string; y: number }[] }>;

  /**
   * Retrieves the time frame for a measurement based on the provided parameters.
   * @param dataSource The InfluxDB data source configuration.
   * @param measurement The measurement name.
   * @returns An object containing the start and stop timestamps of the time frame.
   */
  abstract getTimeFrameOfMeasurement(
    dataSource: T,
    measurement: string,
  ): Promise<{
    stop: number;
    start: number;
  }>;

  /**
   * Retrieves the count of data points for a given measurement within a specified time range from data source.
   * @param dataSource The details of data source.
   * @param start The start timestamp of the time range.
   * @param stop The stop timestamp of the time range.
   * @param measurement The measurement name.
   * @returns An object containing the count of data points grouped by field.
   */
  abstract getDataCount(
    dataSource: T,
    start: number,
    stop: number,
    measurement: string,
  ): Promise<{ [key: string]: number }>;

  /**
   * Retrieves measurements and their associated features from data source.
   * @param influxDetails The details of data source.
   * @returns A Promise resolving to a list of measurements.
   */
  abstract getMeasurements(influxDetails: T): Promise<string[]>;


  /**
   * Retrieves the features (fields) available in a dataset from data source.
   * @param influxDetails The details of data source.
   * @param dataset The dataset (measurement) to retrieve features for.
   * @returns A Promise that resolves to an array of feature names.
   */
  abstract getFeatures(dataSource: T, dataset: string): Promise<string[]>;

  /**
   * Tests the connection to data source.
   * @param ds The details of data source.
   * @returns A Promise that resolves to true if the connection is successful, otherwise false.
   */
  abstract testConnection(ds: T): Promise<boolean>;

  /**
   * Writes an annotation to the data source.
   * @param dataSource The details of data source.
   * @param dataset - The name of the dataset to which the annotation belongs.
   * @param timestamp - The timestamp of the data point being annotated.
   * @param label - The annotation label to be added.
   * @returns A promise that resolves when the annotation is successfully written.
   */
  abstract writeAnnotation(
    dataSource: T,
    dataset: string,
    timestamp: number,
    label: string,
  ): Promise<AnnotationDto>;

  /**
   * Reads annotations from the datasource within the specified time range.
   *
   * @param {T} dataSource - The datasource configuration object.
   * @param {string} dataset - The name of the dataset (measurement) to query.
   * @param {string} startTime - The start time for the query range in time format (e.g., '2021-09-01T00:00:00Z').
   * @param {string} stopTime - The end time for the query range in time format (e.g., '2021-09-30T23:59:59Z').
   * @returns {Promise<AnnotationDto[]>} A promise that resolves to an array of annotations retrieved from.
   */
  abstract readAnnotations(
    dataSource: T,
    dataset: string,
    startTime: number,
    stopTime: number,
  ): Promise<AnnotationDto[]>;

  /**
   * Deletes an annotation from Data Source based on the specified parameters.
   *
   * @param dataSource The details of data source.
   * @param {string} dataset - The Dataset name.
   * @param {string} timestamp - The timestamp of the annotation to be deleted, in a format that can be parsed by JavaScript's Date object.
   * @param {string} label - The label of the annotation to be deleted.
   *
   * @returns {Promise<void>} A promise that resolves when the deletion is complete.
   */
  abstract deleteAnnotation(
    dataSource: T,
    dataset: string,
    timestamp: number,
    label: string,
  ): Promise<void>;

  /**
   * Deletes annotations by label within a specified timeframe from data source.
   *
   * @param dataSource The details of data source.
   * @param {string} dataset - The Dataset name.
   * @param {string[]} annotationTags - The labels of the annotations to delete.
   * @param {number|string} startTime - The start time for the timeframe in milliseconds or ISO string.
   * @param {number|string} stopTime - The stop time for the timeframe in milliseconds or ISO string.
   *
   * @returns {Promise<void>} A promise that resolves when the deletion is complete.
   */
  abstract deleteAnnotationsByLabel(
    dataSource: T,
    dataset: string,
    annotationTags: string[],
    startTime: number | string,
    stopTime: number | string,
  ): Promise<void>;
}
