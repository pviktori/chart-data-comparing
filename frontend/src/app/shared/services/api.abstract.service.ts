import { environment } from '../../../environments/environment';

type stringNumberUnion = string | number;

export class ApiService {
  private _baseUrl = '';

  get baseUrl() {
    return this._baseUrl;
  }

  constructor(serviceUrl: string) {
    this._baseUrl = new URL(serviceUrl, this.getMainBackendUrl()).href;
  }

  getUrl(...endpoint: stringNumberUnion[]) {
    return `${this._baseUrl}/${(endpoint ?? []).join('/')}`;
  }

  getMainBackendUrl() {
    return environment.production
      ? new URL('/service/backend/', window.location.origin).href
      : environment.backendUrl;
  }
}
