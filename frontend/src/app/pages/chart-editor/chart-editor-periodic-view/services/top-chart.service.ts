import { Injectable } from '@angular/core';
import {
  InputChartEditorChartData,
  ChartEditorLineChartDataItem,
  SessionDataRequest,
  ZoomArea,
} from '@shared/models';
import { DataSourcesDetailsService } from '@shared/services';
import { BehaviorSubject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TopChartService {
  private _data$ = new BehaviorSubject<{ [key: string]: ChartEditorLineChartDataItem[] }>({});

  zoom$ = new BehaviorSubject<ZoomArea>({ min: 0, max: null });

  get data$() {
    return this._data$.asObservable();
  }

  constructor(private _dataSourcesDetailsService: DataSourcesDetailsService) {}

  loadGalleryItems$(input: InputChartEditorChartData, sessionID: string) {
    const params: SessionDataRequest = {
      start: new Date(input.start!).valueOf(),
      stop: new Date(input.stop!).valueOf(),
      queryErrors: 0,
    };

    return this._dataSourcesDetailsService
      .getSessionData$(input.dataSource.type, input.dataSource.id, sessionID, params)
      .pipe(
        tap(data => {
          this._data$.next(data);
        }),
      );
  }

  resetData() {
    this._data$.next({});
    this.zoom$.next({ min: 0, max: undefined });
  }
}
