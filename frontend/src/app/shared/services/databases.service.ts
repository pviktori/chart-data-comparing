import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { DatabaseConfigs, DatabasesInfo } from '../models';

@Injectable({
  providedIn: 'root',
})
export class DatabasesService {
  private _databases$ = new BehaviorSubject<DatabasesInfo | null>(null);
  private _databasesConfig$ = new BehaviorSubject<null | DatabaseConfigs>(null);

  constructor(private _http: HttpClient) {
    this.getDatabasesConfigs();
    this.getDatabasesInfoConfigs();
  }

  get databases$(): Observable<DatabasesInfo | null> {
    return this._databases$.asObservable();
  }

  get databasesConfig$() {
    return this._databasesConfig$.asObservable();
  }

  getDatabasesConfigs() {
    this._fetchDatabasesConfigs().subscribe(configs => {
      this._databasesConfig$.next(configs);
    });
  }

  getDatabasesInfoConfigs() {
    this._fetchDatabasesInfoConfigs().subscribe(configs => {
      this._databases$.next(configs);
    });
  }

  private _fetchDatabasesConfigs() {
    return this._http.get<DatabaseConfigs>('assets/configs/databases.config.json');
  }

  private _fetchDatabasesInfoConfigs() {
    return this._http.get<DatabasesInfo>('assets/configs/databases-info.config.json');
  }
}
