import {computed, Injectable, signal} from '@angular/core';
import {Team, TeamMove, TeamSlot} from './team.model';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly _team = signal<Team>(this.emptyTeam());
  readonly slots = computed(() => this._team().slots);

  // Ces deux méthodes brancheront sur le vrai backend plus tard
  loadTeam(userId: string): void {
    // TODO: this.http.get(`/api/teams/${userId}`)
    // Pour l'instant : ne rien faire, la team est vide par défaut
  }

  saveTeam(): void {
    // TODO: this.http.put(`/api/teams`, this._team())
    // Pour l'instant : console.log ou rien
  }

  setSlot(index: number, pokemon: TeamSlot): void {
    this._team.update(team => {
      const slots = [...team.slots];
      slots[index] = pokemon;
      return { ...team, slots };
    });
  }

  clearSlot(index: number): void {
    this._team.update(team => {
      const slots = [...team.slots];
      slots[index] = null;
      return { ...team, slots };
    });
  }

  setMove(slotIndex: number, moveIndex: number, move: TeamMove): void {
    this._team.update(team => {
      const slots = [...team.slots];
      const slot = slots[slotIndex];
      if (!slot) return team;

      const moves = [...slot.moves];
      moves[moveIndex] = move;
      slots[slotIndex] = { ...slot, moves };
      return { ...team, slots };
    });
  }

  private emptyTeam(): Team {
    return { userId: '', slots: Array(6).fill(null) };
  }

  resetTeam(): void {
    this._team.set(this.emptyTeam());
  }
}
