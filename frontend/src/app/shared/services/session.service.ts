import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CreateSession, Session } from '@shared/models/session';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from './api.abstract.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService extends ApiService {
  private _session$ = new BehaviorSubject<Session | null>(null);
  private _sessions$ = new BehaviorSubject<Session[]>([]);
  private _loading$ = new BehaviorSubject(false);

  get loading$() {
    return this._loading$.asObservable();
  }

  get session$(): Observable<Session | null> {
    return this._session$.asObservable();
  }

  get sessions$(): Observable<Session[]> {
    return this._sessions$.asObservable();
  }

  constructor(private _http: HttpClient) {
    super('session');
  }

  createSession$(createSession: CreateSession) {
    this._startLoading();
    return this._http.post<Session>(this.getUrl(), createSession).pipe(
      tap(result => {
        this._stopLoading();
        this._session$.next(result);
        this._updateCurrentSessions(result);
      })
    );
  }

  getSession$(sessionId: string) {
    this._startLoading();

    return this._http.get<Session>(`${this.getUrl()}${sessionId}`).pipe(
      tap(() => {
        this._stopLoading();
      })
    );
  }

  getSessions$() {
    this._startLoading();

    return this._http.get<Session[]>(`${this.getUrl()}`).pipe(
      tap(sessions => {
        this._stopLoading();
        this._sessions$.next(sessions);
      })
    );
  }

  updateSession$(sessionId: string, data: Partial<CreateSession>) {
    this._startLoading();

    return this._http.put<Session>(`${this.getUrl()}${sessionId}`, data).pipe(
      tap(session => {
        this._stopLoading();
        this._updateCurrentSessions(session);
      })
    );
  }
  deleteSession$(sessionId: string) {
    this._startLoading();

    return this._http.delete<Session>(`${this.getUrl()}${sessionId}`).pipe(
      tap(() => {
        this._stopLoading();
        this._sessions$.next(this._sessions$.getValue().filter(s => s.id !== sessionId));
      })
    );
  }

  clearCurrentSession() {
    this._session$.next(null);
  }

  private _startLoading() {
    this._loading$.next(true);
  }

  private _stopLoading() {
    this._loading$.next(false);
  }

  private _updateCurrentSessions(data: Partial<Session> & { id: string }) {
    const currentSessions = this._sessions$.getValue();
    const session = currentSessions.find(session => session.id === data.id);
    if (!session) {
      this._sessions$.next(currentSessions.concat([data as Session]));
      return;
    }

    this._sessions$.next(currentSessions.map(s => ({ ...s, ...data })));
  }
}
