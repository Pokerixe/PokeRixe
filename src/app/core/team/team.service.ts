import {computed, inject, Injectable, signal} from '@angular/core';
import {Team, TeamMove, TeamSlot} from './team.model';

@Injectable({providedIn: 'root'})
export class TeamService {

  private readonly _team = signal<Team>(this.emptyTeam());
  readonly slots = computed(() => this._team().slots);

  loadTeam(userId: string): void {
    // TODO: this.http.get(`/api/teams/${userId}`)
    // Les teams ont bien été chargées, on met à jour le signal
    this._team.set({
      userId,
      slots: [
        {
          slotIndex: 1,
          pokedexId: 25,
          name: 'Pikachu',
          sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
          types: ['Electric'],
          moves: [
            {slot: 1, name: 'Thunder Shock', type: 'Electric', power: 40, accuracy: 100, damageClass: 'Special'},
            {slot: 2, name: 'Quick Attack', type: 'Normal', power: 40, accuracy: 100, damageClass: 'Physical'},
            {slot: 3, name: 'Iron Tail', type: 'Steel', power: 100, accuracy: 75, damageClass: 'Physical'},
            {slot: 4, name: 'Electro Ball', type: 'Electric', power: null, accuracy: 100, damageClass: 'Special'},
          ],
        },
        null,
        null,
        null,
        null,
        null,
      ],

    });
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
    return {userId: '', slots: Array(6).fill(null)};
  }

  resetTeam(): void {
    this._team.set(this.emptyTeam());
  }
}
