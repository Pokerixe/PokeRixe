import {computed, Injectable, signal} from '@angular/core';
import {Team, TeamMove, TeamSlot} from './team.model';
import {HttpClient} from '@angular/common/http';
import {Observable, tap} from 'rxjs';
import {environment} from '../../../environments/environment';

@Injectable({providedIn: 'root'})
export class TeamService {

  private readonly BASE = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private readonly _team = signal<Team>(this.emptyTeam());
  readonly slots = computed(() => this._team().slots);
  readonly firstPokemon = computed(() => this._team().firstPokemon);

  /**
   * Charge la team de l utilisateur depuis l API (mockée par l interceptor)
   * et met à jour le signal _team avec la valeur retournée.
   */
  loadTeam(userId: string): Observable<Team> {
    console.log('Loading team...');
    return this.http.get<Team>(`${this.BASE}/team`).pipe(
      tap((team) => {
        this._team.set({
          ...team,
          userId: team.userId ?? userId,
        });
      }),
    );
  }

  setFirstPokemon(slotIndex: number): void {
    if (slotIndex < 0 || slotIndex >= this._team().slots.length) {
      return;
    }
    this._team.update(team => ({...team, firstPokemon: slotIndex}));
  }

  saveTeam(): void {
    // TODO: this.http.put(`/api/teams`, this._team())
  }

  setSlot(index: number, pokemon: TeamSlot): void {
    this._team.update(team => {
      const slots = [...team.slots];
      slots[index] = pokemon;
      return {...team, slots};
    });
  }

  clearSlot(index: number): void {
    this._team.update(team => {
      const slots = [...team.slots];
      slots[index] = null;
      return {...team, slots};
    });
  }

  setMove(slotIndex: number, moveIndex: number, move: TeamMove): void {
    this._team.update(team => {
      const slots = [...team.slots];
      const slot = slots[slotIndex];
      if (!slot) return team;

      const moves = [...slot.moves];
      moves[moveIndex] = move;
      slots[slotIndex] = {...slot, moves};
      return {...team, slots};
    });
  }

  private emptyTeam(): Team {
    return {
      userId: '',
      slots: Array(6).fill(null),
      firstPokemon: 0,
    };
  }

  resetTeam(): void {
    this._team.set(this.emptyTeam());
  }
}
