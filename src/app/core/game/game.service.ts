import {inject, Injectable, signal} from '@angular/core';
import {GameCreationData, GamePlay} from './game.model';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable, map, tap} from 'rxjs';
import {environment} from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';
import {User} from '../models/user.model';
import {AuthService} from '../auth/auth.service';

/**
 * Service de gestion des parties multijoueur.
 * Maintient la liste des parties disponibles et la partie courante via des signaux Angular.
 * Toutes les réponses backend sont enveloppées dans `ApiResponse<T>` et unwrappées via `map(r => r.data)`.
 */
@Injectable({providedIn: 'root'})
export class GameService {

  private readonly BASE = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  private readonly _games = signal<GamePlay[]>([]);
  private readonly _currentGame = signal<GamePlay | null>(null);
  private readonly _isLoading = signal(false);

  /** Signal en lecture seule exposant la liste des parties disponibles. */
  readonly games = this._games.asReadonly();
  /** Signal en lecture seule exposant la partie dans laquelle le joueur se trouve, ou `null`. */
  readonly currentGame = this._currentGame.asReadonly();
  /** Signal en lecture seule indiquant qu'un chargement est en cours. */
  readonly isLoading = this._isLoading.asReadonly();

  /**
   * Récupère la liste des parties en attente depuis le backend et met à jour le signal.
   */
  loadGames(): Observable<GamePlay[]> {
    this._isLoading.set(true);
    return this.http.get<GamePlay[]>(`${this.BASE}games/available`).pipe(
      tap({
        next: (games) => {
          this._games.set(games);
          this._isLoading.set(false);
        },
        error: () => this._isLoading.set(false),
      }),
    );
  }

  /**
   * Crée une nouvelle partie et l'ajoute à la liste locale.
   * Le backend retourne la partie créée avec son id et player1 résolu.
   */
  createGame(description: string): Observable<GameCreationData> {
    const params = new HttpParams().set('description', description);
    return this.http.post<GameCreationData>(`${this.BASE}games`, {}, {params}).pipe(
      tap((game) => {
        localStorage.setItem('fightToken', game.token);
      }),
    );
  }

  /**
   * Rejoint une partie existante en tant que player2.
   * Met à jour la partie dans la liste et la définit comme partie courante.
   */
  joinGame(gameId: string, selectSlotPokemon: number): Observable<string> {
    const params = new HttpParams().set('selectSlotPokemon', selectSlotPokemon);

    return this.http.post(`${this.BASE}games/${gameId}/join`, {}, {
      params,
      responseType: 'text'
    }).pipe(
      tap((token) => {
        localStorage.setItem('fightToken', token);
      })
    );
  }

  /**
   * Efface la partie courante localement (utilisé après la fin du combat).
   */
  clearCurrentGame(): void {
    this._currentGame.set(null);
  }

  /**
   * Quitte la partie courante.
   * Si player1 quitte : la partie est supprimée.
   * Si player2 quitte : player2 est retiré côté backend.
   */
  leaveGame(): void {
    const game = this._currentGame();
    if (!game) return;

    this.http.delete<void>(`${this.BASE}games/${game.id}`).subscribe({
      next: () => {
        this._games.update(games => games.filter(g => g.id !== game.id));
        this._currentGame.set(null);
      },
      error: (err) => console.error('Failed to leave game', err),
    });
  }
}
