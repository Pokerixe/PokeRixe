import { Component, signal, inject } from '@angular/core';
import { TeamService } from '../../core/team/team.service';
import {GameService} from '../../core/game/game.service';
import {Game} from '../../core/game/game.model';

@Component({
  selector: 'app-search-game',
  imports: [],
  templateUrl: './search-game.html',
  styleUrl: './search-game.css',
})
export class SearchGame {

  private readonly gamesService = inject(GameService);

  readonly games = signal<Game[]>([]);

  createModalOpen = signal<boolean>(false);
  description = signal<string>('');

  joinModalOpen = signal<boolean>(false);
  selectedTeamSlot = signal<number | null>(null);

  private readonly teamService = inject(TeamService);

  constructor() {
    this.gamesService.getGames().subscribe((games) => {
      this.games.set(games);
    });
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
    const desc = this.description();
    console.log('Creating game with description:', desc);
    this.closeCreateGame();
  }

  openJoinModal() {
    this.joinModalOpen.set(true);
    document.body.style.overflow = 'hidden';
    this.selectedTeamSlot.set(null);
  }

  closeJoinModal() {
    this.joinModalOpen.set(false);
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
    console.log('Attempting to join game with team slot:', idx, slot);
    // TODO: implement real join logic (call API / route)
    this.closeJoinModal();
  }
}
