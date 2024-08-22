import { Injectable } from '@angular/core';
import { DatabaseTypeEnum } from '@shared/models';
import { Session } from '@shared/models/session';
import { BehaviorSubject, concatMap, delay, filter, first, Observable, of, toArray } from 'rxjs';

export interface SessionLocal extends Omit<Session, 'dataSetId' | 'dataSourceId'> {
  dataSourceId: string | null;
  sessionLocal?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChartEditorService {
  private _tabs$ = new BehaviorSubject<SessionLocal[]>([]);
  private _activeTab$ = new BehaviorSubject<SessionLocal | null>(null);
  private _loading$ = new BehaviorSubject<boolean>(false);
  private _chartLoading$ = new BehaviorSubject<boolean>(false);
  private _chartStatus$ = new BehaviorSubject<string>('chart_editor.getting_the_data_ready_for_you');

  get tabs$(): Observable<SessionLocal[]> {
    return this._tabs$.asObservable();
  }

  get activeTab$(): Observable<SessionLocal | null> {
    return this._activeTab$.asObservable();
  }

  get loading$(): Observable<boolean> {
    return this._loading$.asObservable();
  }

  get chartLoading$(): Observable<boolean> {
    return this._chartLoading$.asObservable();
  }

  get chartStatus$(): Observable<string> {
    return this._chartStatus$.asObservable();
  }

  constructor() {}

  startChartLoading() {
    this._chartLoading$.next(true);
  }

  stopChartLoading() {
    this._chartLoading$.next(false);
  }

  startLoading() {
    this._loading$.next(true);
  }

  stopLoading() {
    this._loading$.next(false);
  }

  addTab(tab: SessionLocal) {
    this._tabs$.next(this._tabs$.getValue().concat(tab));
  }

  updateTabs(tabId: string, tab: Partial<SessionLocal>) {
    this._tabs$.next(
      this._tabs$.getValue().map(item => (item.id === tabId ? { ...item, ...tab } : item))
    );
  }

  deleteTab(tabId: string) {
    this._tabs$.next(this._tabs$.getValue().filter(item => item.id !== tabId));
    if (this._activeTab$.getValue()?.id === tabId) {
      this.deselectActiveTab();
      this.selectActiveTab(this.createInitialTab().id);
    }
  }

  findTab(tabId: string) {
    return this._tabs$.getValue().find(item => item.id === tabId);
  }

  selectActiveTab(tabId: string) {
    const tab = this.findTab(tabId);
    if (!tab) {
      return null;
    }

    this._activeTab$.next(tab);

    return tab;
  }

  deselectActiveTab() {
    this._activeTab$.next(null);
  }

  updateActiveTab(tab: Partial<SessionLocal>) {
    this._activeTab$
      .pipe(
        filter(session => !!session),
        first()
      )
      .subscribe(session => {
        if (!session) return;
        const data = {
          ...(session as SessionLocal),
          ...tab
        };
        this._activeTab$.next(data);
        this.updateTabs(session.id, data);
      });
  }

  createInitialTab() {
    if (this._tabs$.getValue().length) {
      const activeTab = this.findTab(this._activeTab$.getValue()?.id || '');
      return activeTab || this._tabs$.getValue()[0];
    }
    return this.createEmptyTab();
  }

  createEmptyTab() {
    const newSession = this._getEmptySession();
    this.addTab(newSession);
    return newSession;
  }

  // imitates the work of status update
  setChartStatus$() {
    this.startChartLoading();
    const data = [
      {
        time: 1000 + this._randomNumberInBetween(0, 500),
        message: 'chart_editor.loading_message_1'
      },
      {
        time: 1000 + this._randomNumberInBetween(200, 1000),
        message: 'chart_editor.loading_message_2'
      },
      {
        time: 2500 + this._randomNumberInBetween(500, 2000),
        message: 'chart_editor.loading_message_3'
      },
      {
        time: 2000 + this._randomNumberInBetween(0, 500),
        message: 'chart_editor.loading_message_4'
      },
      { time: 2000, message: 'chart_editor.almost_done' }
    ];
    return of(...data).pipe(
      concatMap(value => {
        this._chartStatus$.next(value.message);
        return of(value).pipe(delay(value.time));
      }),
      toArray()
    );
  }

  resetChartStatus() {
    this._chartStatus$.next('chart_editor.getting_the_data_ready_for_you');
  }

  private _getEmptySession(): SessionLocal {
    return {
      dataSourceId: null,
      features: [],
      id: Math.round(Math.random() * 10000) + '',
      databaseType: DatabaseTypeEnum.EMPTY,
      dataTimerangeStart: '',
      dataTimerangeStop: '',
      filters: [],
      dataset: null,
      sessionLocal: true
    };
  }

  private _randomNumberInBetween(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}
