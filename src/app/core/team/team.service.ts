import {computed, inject, Injectable, signal} from '@angular/core';
import {Team, TeamMove, TeamSlot} from './team.model';

@Injectable({providedIn: 'root'})
export class TeamService {

  private readonly _team = signal<Team>(this.emptyTeam());
  readonly slots = computed(() => this._team().slots);
  readonly firstPokemon = computed(() => this._team().firstPokemon);

  loadTeam(userId: string): void {
    // TODO: this.http.get(`/api/teams/${userId}`)
    // Les teams ont bien été chargées, on met à jour le signal
    this._team.set({
      userId,
      slots: [
        null,
        null,
        null,
        null,
        null,
        null,
      ],
      firstPokemon: 0,
    });
  }

  setFirstPokemon(slotIndex: number): void {
    if (slotIndex <= 0 || slotIndex > 6) {
      return;
    } else {
      this._team.update(team => ({...team, firstPokemon: slotIndex}));
    }
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
    return {userId: '', slots: Array(6).fill(null), firstPokemon: 1};
  }

  resetTeam(): void {
    this._team.set(this.emptyTeam());
  }
}
