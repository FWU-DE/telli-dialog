import http from 'k6/http';

export class HttpProxy {
  private apiKey: string;
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    if (!__ENV.API_KEY) {
      throw new Error('API_KEY environment variable is not set');
    }
    this.apiKey = __ENV.API_KEY;

    this.baseUrl = __ENV.LOADTEST_BASE_URL || 'http://localhost:3000';
    if (!__ENV.LOADTEST_BASE_URL) {
      console.warn(
        'LOADTEST_BASE_URL environment variable is not set, defaulting to: ' + this.baseUrl,
      );
    }

    this.headers = {
      Authorization: 'Bearer ' + this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  get(url: string, queryParams?: Record<string, unknown>) {
    const finalUrl = queryParams
      ? url +
        '?' +
        Object.entries(queryParams)
          .map(([k, v]) => `${k}=${v}`)
          .join('&')
      : url;
    return http.get(`${this.baseUrl}${finalUrl}`, { headers: this.headers });
  }

  patch(url: string, payload: Record<string, unknown>) {
    return http.patch(`${this.baseUrl}${url}`, JSON.stringify(payload), { headers: this.headers });
  }

  post(url: string, payload: Record<string, unknown>) {
    return http.post(`${this.baseUrl}${url}`, JSON.stringify(payload), { headers: this.headers });
  }

  delete(url: string, payload?: Record<string, unknown>) {
    if (payload) {
      return http.request('DELETE', `${this.baseUrl}${url}`, JSON.stringify(payload), {
        headers: this.headers,
      });
    } else {
      return http.request('DELETE', `${this.baseUrl}${url}`, null, {
        headers: this.headers,
      });
    }
  }
}
