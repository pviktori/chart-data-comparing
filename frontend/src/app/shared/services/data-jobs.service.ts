import { Injectable } from '@angular/core';
import { ApiService } from './api.abstract.service';
import { Observable, catchError, filter, interval, switchMap, takeWhile, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class DataJobsService extends ApiService {
  constructor(private _http: HttpClient) {
    super('data-jobs');
  }

  getJobData<T>(sessionId: string): Observable<T> {
    return this._http
      .get<T>(this.getUrl(sessionId, 'data'))
      .pipe(catchError(() => throwError(() => new Error('Error retrieving job data'))));
  }

  getJobStatus(sessionID: string): Observable<{ status: string }> {
    const url = this.getUrl(sessionID, 'status');
    return this._http.get<{ status: string }>(url);
  }

  pollJobStatus(sessionID: string): Observable<{ status: string }> {
    return interval(1000).pipe(
      switchMap(() => this.getJobStatus(sessionID)),
      takeWhile(response => !this._isProcessFinished(response.status), true),
      filter(response => this._isProcessFinished(response.status)),
      catchError(() => throwError(() => new Error('Error checking job status'))),
    );
  }

  private _isProcessFinished(status: string) {
    return ['COMPLETE', 'ERROR'].includes(status);
  }
}
