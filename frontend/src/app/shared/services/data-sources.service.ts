import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import {
  CreateDataSource,
  DatabaseTypeEnum,
  DatabaseUnit,
  DataSource,
  DataSourceCommonForm,
  DataSourceConfigs,
  DataSourceInflux,
  DataSourcesResponse,
} from '../models';
import { ApiService } from './api.abstract.service';

@Injectable({
  providedIn: 'root',
})
export class DataSourcesService extends ApiService {
  private _dataSources$ = new BehaviorSubject<DataSourcesResponse | null>(null);

  constructor(private _http: HttpClient) {
    super('data-sources');
  }

  get dataSources$(): Observable<DataSourcesResponse | null> {
    return this._dataSources$.asObservable();
  }

  getDataSources() {
    this._fetchDataSources$()
      .pipe(tap(dataSource => this._dataSources$.next(dataSource)))
      .subscribe();
  }

  getCurrentDataSource<T extends DataSource>(id: string): T | undefined {
    return Object.values(this._dataSources$.getValue() || {})
      .flat()
      .find(ds => ds.id === id) as T;
  }

  getDataSource$(type: DatabaseUnit, id: string): Observable<DataSource | undefined> {
    return this._fetchDataSource$(type, id);
  }

  createDataSource<T extends CreateDataSource, U extends DataSource>(
    type: DatabaseUnit,
    body: T,
    callback?: (value: U) => void,
  ) {
    this._createDataSource$<T, U>(type, body)
      .pipe(
        tap(res => {
          if (type === DatabaseTypeEnum.EMPTY) return;
          const dataSources = this._dataSources$.getValue();
          this._updateDataSources(type, [...(dataSources?.[type] || []), res]);
        }),
      )
      .subscribe(result => {
        callback?.(result);
      });
  }

  updateDataSource<T extends CreateDataSource, U extends DataSource>(
    type: DatabaseUnit,
    id: string,
    body: T,
    callback?: (value: U) => void,
  ) {
    this._updateDataSource$<T, U>(type, id, body)
      .pipe(
        tap(res => {
          if (type === DatabaseTypeEnum.EMPTY) return;
          const dataSources = this._dataSources$.getValue();
          this._updateDataSources(
            type,
            (dataSources?.[type] || []).map(ds => (ds.id === id ? res : ds)),
          );
        }),
      )
      .subscribe(result => {
        callback?.(result);
      });
  }

  testConnection$(type: DatabaseUnit, dto: CreateDataSource): Observable<boolean> {
    return this._testConnection(type, dto);
  }

  deleteDataSource(type: DatabaseUnit, id: string, callback?: (value: boolean) => void) {
    this._deleteDataSource(type, id)
      .pipe(
        tap(() => {
          const dataSources = this._dataSources$.getValue();
          if (type === DatabaseTypeEnum.EMPTY) return;
          this._updateDataSources(
            type,
            (dataSources?.[type] as DataSource[]).filter(ds => ds.id !== id),
          );
        }),
      )
      .subscribe(result => {
        callback?.(result);
      });
  }

  getDataSourceConfigs(
    dataSource: DataSource | DataSourceCommonForm,
  ): DataSourceConfigs<DataSource> {
    // eslint-disable-next-line
    const result: { [key: string]: any } = { ...dataSource };

    delete result['id'];
    delete result['type'];
    delete result['name'];

    return result as DataSourceConfigs<DataSource>;
  }

  getDataSourceCommonForm(dataSource: DataSource): DataSourceCommonForm {
    let url = '';
    let table = '';
    switch (dataSource.type) {
      case DatabaseTypeEnum.INFLUX:
        url = (dataSource as DataSourceInflux).url;
        table = (dataSource as DataSourceInflux).bucket;
        break;

      default:
        break;
    }

    return { ...dataSource, url, table };
  }

  private _fetchDataSource$<T extends DataSource>(type: DatabaseUnit, id: string): Observable<T> {
    return this._http.get<T>(this.getUrl(type, id));
  }

  private _updateDataSource$<T, U>(type: DatabaseUnit, id: string, body: T): Observable<U> {
    return this._http.put<U>(this.getUrl(type, id), body);
  }

  private _createDataSource$<T, U>(type: DatabaseUnit, body: T): Observable<U> {
    return this._http.post<U>(this.getUrl(type), body);
  }

  private _fetchDataSources$(): Observable<DataSourcesResponse> {
    return this._http.get<DataSourcesResponse>(this.getUrl());
  }

  private _updateDataSources<T extends DataSource>(type: DatabaseUnit, data: T[]) {
    const currentValue = this._dataSources$.getValue();

    if (!currentValue) {
      this.getDataSources();
      return;
    }

    this._dataSources$.next({
      ...(this._dataSources$.getValue() ?? {
        influx: [],
      }),
      [type]: data,
    });
  }

  private _testConnection(type: DatabaseUnit, dto: CreateDataSource): Observable<boolean> {
    return this._http.post<boolean>(this.getUrl(type, 'test-connection'), dto);
  }

  private _deleteDataSource(type: DatabaseUnit, id: string): Observable<boolean> {
    return this._http.delete<boolean>(this.getUrl(type, id));
  }
}
