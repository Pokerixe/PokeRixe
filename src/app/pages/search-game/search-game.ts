import { Component, signal, inject } from '@angular/core';
import { TeamService } from '../../core/team/team.service';
import {GameService} from '../../core/game/game.service';

@Component({
  selector: 'app-search-game',
  imports: [],
  templateUrl: './search-game.html',
  styleUrl: './search-game.css',
})
export class SearchGame {

  private readonly gamesService = inject(GameService);
  private readonly teamService = inject(TeamService);
  readonly games = this.gamesService.games;
  readonly isLoading = this.gamesService.isLoading;

  createModalOpen = signal<boolean>(false);
  description = signal<string>('');

  joinModalOpen = signal<boolean>(false);
  selectedTeamSlot = signal<number | null>(null);
  selectedGameId = signal<number | null>(null);

  constructor() {
    this.gamesService.loadGames().subscribe();
  }

  get teamSlots() {
    return this.teamService.slots();
  }

  openCreateGame() {
    this.createModalOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeCreateGame() {
    this.createModalOpen.set(false);
    document.body.style.overflow = '';
  }

  submitCreateGame() {
    const nombrePokemon = this.teamSlots.filter(s => !!s).length || 1;
    this.gamesService.createGame({ description: this.description(), nombrePokemon }).subscribe({
      next: () => this.closeCreateGame(),
      error: (err) => console.error('Failed to create game', err),
    });
  }

  openJoinModal() {
    this.joinModalOpen.set(true);
    document.body.style.overflow = 'hidden';
    this.selectedTeamSlot.set(null);
  }

  closeJoinModal() {
    this.joinModalOpen.set(false);
    this.selectedGameId.set(null);
    document.body.style.overflow = '';
  }

  selectTeamSlot(index: number) {
    this.selectedTeamSlot.set(index);
  }

  confirmJoin() {
    const idx = this.selectedTeamSlot();
    if (idx === null) {
      console.warn('No pokemon selected to join the game');
      return;
    }
    const slot = this.teamSlots[idx];
    if (!slot) {
      console.warn('Selected slot is empty, cannot join');
      return;
    }

    const gameId = this.selectedGameId();
    if (gameId === null) {
      console.error('No game id set while confirming join');
      return;
    }

    // Count non-null team slots to infer number of pokemons
    const nombrePokemon = this.teamSlots.filter(s => !!s).length;
    console.log(`Joining game ${gameId} with ${nombrePokemon} pokemons (selected slot ${idx})`);

    // Call the GameService to join. subscribe to handle result or error
    this.gamesService.joinGame(gameId).subscribe({
      next: (game) => {
        console.log('Joined game:', game);
        // optionally you could navigate or update state here
      },
      error: (err) => {
        console.error('Failed to join game', err);
      },
      complete: () => {
        this.closeJoinModal();
      }
    });
  }
}
