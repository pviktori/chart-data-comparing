import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DatabaseUnit, ChartEditorLineChartDataItem, SessionDataRequest } from '@shared/models';
import { BehaviorSubject, catchError, Observable, of, switchMap, tap } from 'rxjs';

import { ApiService } from './api.abstract.service';
import { DataJobsService } from './data-jobs.service';

@Injectable({
  providedIn: 'root',
})
export class DataSourcesDetailsService extends ApiService {
  private _dataSetsAndFeatures$: BehaviorSubject<{ [key: string]: string[] }> = new BehaviorSubject(
    {},
  );

  get dataSetsAndFeatures$() {
    return this._dataSetsAndFeatures$.asObservable();
  }

  constructor(
    private _http: HttpClient,
    private _dataJobsService: DataJobsService,
  ) {
    super('data-sources-details');
  }

  getDataSetNames$(dsType: DatabaseUnit, id: string) {
    return this._http.get<{ [key: string]: string[] }>(this.getUrl(dsType, id, 'tables')).pipe(
      tap(data => {
        this._dataSetsAndFeatures$.next(data);
      }),
      catchError(() => of(null)),
    );
  }

  getSessionData$(
    dsType: DatabaseUnit,
    id: string,
    sessionId: string,
    params: SessionDataRequest,
  ): Observable<{ [key: string]: ChartEditorLineChartDataItem[] }> {
    return this._http
      .get(this.getUrl(dsType, id, sessionId, 'data'), {
        params: params as any,
      })
      .pipe(
        switchMap(() => this._dataJobsService.pollJobStatus(sessionId)),
        switchMap(() =>
          this._dataJobsService.getJobData<{ [key: string]: ChartEditorLineChartDataItem[] }>(
            sessionId,
          ),
        ),
        catchError(() => of({})),
      );
  }

  getSessionDataCount$(
    dsType: DatabaseUnit,
    id: string,
    sessionId: string,
    table: string,
    params: SessionDataRequest,
  ) {
    return this._http
      .get<{ [key: string]: number }>(this.getUrl(dsType, id, 'count'), {
        params: { ...params, sessionID: sessionId, table } as any,
      })
      .pipe(catchError(() => of({})));
  }

  getAvailableDatasetTimeFrame$(
    dsType: DatabaseUnit,
    id: string,
    dataset: string,
  ): Observable<{ start: number; stop: number }> {
    return this._http
      .get<{ start: number; stop: number }>(this.getUrl(dsType, id, 'available-time-frame'), {
        params: { dataset },
      })
      .pipe(catchError(() => of({ start: 0, stop: 0 })));
  }

  getInfluxTagsAndFields(
    dsType: DatabaseUnit,
    id: string,
    dataset: string,
  ): Observable<{ tags: string[]; fields: string[] }> {
    return this._http
      .get<{ tags: string[]; fields: string[] }>(this.getUrl(dsType, id, 'fields-and-tags'), {
        params: { dataset },
      })
      .pipe(catchError(() => of({ tags: [], fields: [] })));
  }

  getFeatures(dsType: DatabaseUnit, id: string, dataset: string): Observable<string[]> {
    return this._http
      .get<string[]>(this.getUrl(dsType, id, dataset, 'features'))
      .pipe(catchError(() => of([])));
  }

  uploadDataSourceCsv(
    dsType: DatabaseUnit,
    id: string,
    file: File,
  ): Observable<{ message: string; count?: number; error?: any }> {
    const formData = new FormData();
    formData.append('file', file);
    return this._http.post<{ message: string }>(this.getUrl(dsType, id, 'upload'), formData);
  }
}
