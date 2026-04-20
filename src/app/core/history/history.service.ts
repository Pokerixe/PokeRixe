import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';
import { GameHistoryEntry } from './history.model';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private readonly BASE = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  private readonly _history = signal<GameHistoryEntry[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly history = this._history.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  loadHistory(): Observable<GameHistoryEntry[]> {
    this._isLoading.set(true);
    return this.http.get<ApiResponse<GameHistoryEntry[]>>(`${this.BASE}games/history`).pipe(
      map((r) => r.data),
      tap({
        next: (entries) => {
          this._history.set(entries);
          this._isLoading.set(false);
        },
        error: () => {
          this._error.set("Impossible de charger l'historique");
          this._isLoading.set(false);
        },
      }),
    );
  }
}
