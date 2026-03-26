import {Injectable, signal} from '@angular/core';
import {Game} from './game.model';
import {HttpClient} from '@angular/common/http';
import {Observable, tap} from 'rxjs';
import {environment} from '../../../environments/environment';

@Injectable({providedIn: 'root'})
export class GameService {

  private readonly BASE = environment.apiUrl;

  constructor(private http: HttpClient) {
  }

  private readonly _games = signal<Game[]>([]);
  readonly games = this._games.asReadonly();

  getGames(): Observable<Game[]> {
    console.log("Get games lancé ");
    return this.http.get<Game[]>(`${this.BASE}/games`);
  }

  private readonly _currentGame = signal<Game | null>(null);
  readonly currentGame = this._currentGame.asReadonly();

  loadGames(): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.BASE}/game`).pipe(
      tap(games => this._games.set(games))
    );
  }

  createGame(payload: { description: string; nombrePokemon: number }): Observable<Game> {
    return this.http.post<Game>(`${this.BASE}/games`, payload).pipe(
      tap(game => this._currentGame.set(game))
    );
  }

  joinGame(gameId: number): Observable<Game> {
    return this.http.post<Game>(`${this.BASE}/games/${gameId}/join`, {}).pipe(
      tap(game => this._currentGame.set(game))
    );
  }

  leaveGame(): void {
    this._currentGame.set(null);
  }


}
