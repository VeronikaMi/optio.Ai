import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { AGGREGATE, FACTS, FINDS } from '../interfaces';

const API: string =
  'https://api.next.insight.optio.ai/api/v2/analytics/transactions/facts/';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient) {}

  public aggregateTransactionFactsBy(params: AGGREGATE): Observable<FACTS[]> {
    return this.http
      .post<{ data: FACTS[] }>(`${API}aggregate`, params)
      .pipe(map((data: { data: FACTS[] }) => ({ ...data.data })));
  }

  public findFactsBy(params: FINDS) {
    return this.http
      .post<{ data: FINDS[] }>(`${API}find`, params)
      .pipe(map((data: { data: FINDS[] }) => ({ ...data.data })));
  }
}
