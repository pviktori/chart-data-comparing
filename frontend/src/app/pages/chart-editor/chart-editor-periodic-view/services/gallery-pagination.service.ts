import { Injectable } from '@angular/core';
import { DataSourcesDetailsService } from '@shared/services';
import { BehaviorSubject, switchMap, tap } from 'rxjs';
import { GalleryItem } from '../models/gallery-item';
import { InputChartEditorChartData, SessionDataRequest } from '@shared/models';

@Injectable({
  providedIn: 'root',
})
export class GalleryPaginationService {
  private _currentPage$ = new BehaviorSubject<number>(1);
  private _pageCount$ = new BehaviorSubject<number>(1);
  private _galleryItems$ = new BehaviorSubject<GalleryItem[]>([]);

  constructor(private _dataSourcesDetailsService: DataSourcesDetailsService) {}

  selectPage(page: number) {
    this._currentPage$.next(page);
  }

  get currentPage$() {
    return this._currentPage$.asObservable();
  }

  get page$() {
    return this._galleryItems$.asObservable();
  }

  get pageCount$() {
    return this._pageCount$.asObservable();
  }

  loadGalleryItems$(
    input: InputChartEditorChartData,
    sessionID: string,
    dates: { min: number | null; max?: number | null },
    page = 1,
    pageSize = 16,
  ) {
    const params: SessionDataRequest = {
      start: dates.min ? dates.min : new Date(input.start!).valueOf(),
      stop: new Date(input.stop!).valueOf(),
      queryErrors: 0,
    };

    if (dates.max) {
      params['stop'] = dates.max;
    }

    return this._dataSourcesDetailsService
      .getSessionData$(input.dataSource.type, input.dataSource.id, sessionID, {
        ...params,
        page: page,
        pageSize: pageSize,
        skipAggregate: 1,
      })
      .pipe(
        tap(response => {
          const galleryItems: GalleryItem[] = (Object.values(response)[0] || []).map(
            (data): GalleryItem => ({ name: data.x, status: null, chartData: [] }),
          );

          Object.entries(response).forEach(([featureName, featureData]) => {
            featureData.forEach(data => {
              galleryItems
                .find(g => g.name === data.x)
                ?.chartData.push({ x: featureName, y: data.y });
            });
          });

          this._galleryItems$.next(galleryItems);
        }),
        switchMap(() =>
          this._dataSourcesDetailsService.getSessionDataCount$(
            input.dataSource.type,
            input.dataSource.id,
            sessionID,
            input.dataset,
            params,
          ),
        ),
        tap(count => this._pageCount$.next(Math.ceil(Object.values(count)[0] / pageSize))),
      );
  }

  resetData() {
    this._currentPage$.next(1);
    this._pageCount$.next(1);
    this._galleryItems$.next([]);
  }
}
