import { SessionFilter } from 'src/session/dto';
import { DataSourceExtended } from './data-source.dto';
import { MAX_DATA_POINTS_VALUE } from 'src/settings/settings.constants';

export class DataSourceQueryParams<T extends DataSourceExtended> {
  dataSource!: T;
  start!: number;
  tables!: string[];
  stop: number | null = null;
  filters: SessionFilter[] = [];
  features: string[] = [];
  limit: number | null = null;
  limitOrder: 'asc' | 'desc' = 'asc';
  useAggregation: boolean = false;
  sessionId: string | null = null;
  maxPointCount = MAX_DATA_POINTS_VALUE;
  offset: number | null = null;

  specificParams: { [key: string]: any } = {};

  constructor({
    dataSource,
    start,
    tables,
    features,
    stop,
    filters,
    limit,
    limitOrder,
    useAggregation,
    sessionId,
    maxPointCount,
    offset,
    ...rest
  }: {
    dataSource: T;
    start: number;
    tables: string[];
    features?: string[];
    stop?: number | null;
    filters?: SessionFilter[];
    limit?: number | null;
    limitOrder?: 'asc' | 'desc';
    useAggregation?: boolean;
    sessionId?: string;
    maxPointCount?: number;
    offset?: number | null;

    [key: string]: any;
  }) {
    this.dataSource = dataSource;
    this.start = start;
    this.tables = tables;

    if (stop !== undefined) this.stop = stop;
    if (filters !== undefined) this.filters = filters;
    if (features !== undefined) this.features = features;
    if (limit !== undefined) this.limit = limit;
    if (sessionId !== undefined) this.sessionId = sessionId;
    if (maxPointCount !== undefined) this.maxPointCount = maxPointCount;
    if (useAggregation !== undefined) this.useAggregation = useAggregation;
    if (limitOrder !== undefined) this.limitOrder = limitOrder;
    if (offset !== undefined) this.offset = offset;

    this.specificParams = rest;
  }
}
