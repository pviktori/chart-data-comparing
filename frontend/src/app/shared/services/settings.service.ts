import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ApiService } from './api.abstract.service';
import { CreateSetting, Setting } from '@shared/models';

@Injectable({
  providedIn: 'root',
})
export class SettingsService extends ApiService {
  private _settings$ = new BehaviorSubject<Setting[]>([]);
  public settings$ = this._settings$.asObservable();

  constructor(private _http: HttpClient) {
    super('settings');
  }

  private _handleError(error: any): Observable<never> {
    console.error('An error occurred', error);
    throw error;
  }

  loadSettings(): void {
    this._http
      .get<Setting[]>(this.getUrl())
      .pipe(
        tap(settings => this._settings$.next(settings)),
        catchError(this._handleError),
      )
      .subscribe();
  }

  getSetting$(id: string): Observable<Setting> {
    return this._http.get<Setting>(this.getUrl(id)).pipe(catchError(this._handleError));
  }

  createSetting$(setting: CreateSetting): Observable<Setting> {
    return this._http.post<Setting>(this.getUrl(), setting).pipe(
      tap(newSetting => {
        const currentSettings = this._settings$.value;
        this._settings$.next([...currentSettings, newSetting]);
      }),
      catchError(this._handleError),
    );
  }

  updateSetting$(id: string, setting: Partial<CreateSetting>): Observable<Setting> {
    return this._http.put<Setting>(this.getUrl(id), setting).pipe(
      tap(updatedSetting => {
        const currentSettings = this._settings$.value;
        this._settings$.next(currentSettings.map(s => (s.id === id ? updatedSetting : s)));
      }),
      catchError(this._handleError),
    );
  }

  deleteSetting$(id: string): Observable<void> {
    return this._http.delete<void>(this.getUrl(id)).pipe(
      tap(() => {
        const currentSettings = this._settings$.value;
        this._settings$.next(currentSettings.filter(s => s.id !== id));
      }),
      catchError(this._handleError),
    );
  }
}
