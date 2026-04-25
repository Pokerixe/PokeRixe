import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TeamService } from '../../core/team/team.service';
import { GameService } from '../../core/game/game.service';
import { FightWsService } from '../../core/fight/fight-ws.service';

@Component({
  selector: 'app-search-game',
  imports: [],
  templateUrl: './search-game.html',
  styleUrl: './search-game.css',
})
/**
 * Page de recherche et création de parties multijoueur.
 *
 * Liste les parties en attente (`GameStatus.Waiting`) et permet au joueur de :
 * - **Créer** une nouvelle partie via une modale (description + nombre de Pokémon)
 * - **Rejoindre** une partie existante en choisissant son Pokémon de tête
 *
 * Les données de parties sont chargées au constructeur via `GameService.loadGames()`.
 */
export class SearchGame {

  private readonly gamesService = inject(GameService);
  private readonly teamService = inject(TeamService);
  private readonly router = inject(Router);
  private readonly fightWsService = inject(FightWsService);
  /** Signal en lecture seule exposant la liste des parties disponibles. */
  readonly games = this.gamesService.games;
  /** Signal en lecture seule indiquant qu'un chargement de parties est en cours. */
  readonly isLoading = this.gamesService.isLoading;

  /** `true` lorsque la modale de création de partie est ouverte. */
  createModalOpen = signal<boolean>(false);
  /** Description saisie par l'utilisateur pour la nouvelle partie. */
  description = signal<string>('');

  /** `true` lorsque la modale de rejoindre une partie est ouverte. */
  joinModalOpen = signal<boolean>(false);
  /** Index du slot d'équipe sélectionné pour rejoindre (`null` si aucun). */
  selectedTeamSlot = signal<number | null>(null);
  /** Identifiant de la partie que l'utilisateur souhaite rejoindre. */
  selectedGameId = signal<number | null>(null);

  constructor() {
    this.gamesService.loadGames().subscribe();
  }

  /** Retourne les 6 slots de l'équipe du joueur (certains pouvant être `null`). */
  get teamSlots() {
    return this.teamService.slots();
  }

  /** Ouvre la modale de création de partie et bloque le scroll de la page. */
  openCreateGame() {
    this.createModalOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  /** Ferme la modale de création et réactive le scroll. */
  closeCreateGame() {
    this.createModalOpen.set(false);
    document.body.style.overflow = '';
  }

  /**
   * Soumet la création de partie.
   * Le nombre de Pokémon est calculé automatiquement d'après les slots non nuls de l'équipe.
   */
  submitCreateGame() {
    const nombrePokemon = this.teamSlots.filter(s => !!s).length || 1;
    this.gamesService.createGame({ description: this.description(), nombrePokemon }).subscribe({
      next: (game) => {
        this.closeCreateGame();
        this.fightWsService.connect(game.id);
        this.router.navigate(['/fight', game.id]);
      },
      error: (err) => console.error('Failed to create game', err),
    });
  }

  /**
   * Ouvre la modale de sélection du Pokémon pour rejoindre une partie.
   * @param gameId Identifiant de la partie à rejoindre (à définir avant d'appeler)
   */
  openJoinModal() {
    this.joinModalOpen.set(true);
    document.body.style.overflow = 'hidden';
    this.selectedTeamSlot.set(null);
  }

  /** Ferme la modale de rejoindre et réinitialise la sélection. */
  closeJoinModal() {
    this.joinModalOpen.set(false);
    this.selectedGameId.set(null);
    document.body.style.overflow = '';
  }

  /**
   * Sélectionne un slot de l'équipe comme Pokémon représentant pour rejoindre la partie.
   * @param index Index du slot (0-5)
   */
  selectTeamSlot(index: number) {
    this.selectedTeamSlot.set(index);
  }

  /**
   * Confirme la demande de rejoindre la partie sélectionnée.
   * Vérifie qu'un slot et une partie sont sélectionnés avant d'appeler `GameService.joinGame`.
   */
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
        this.closeJoinModal();
        this.fightWsService.connect(game.id);
        this.router.navigate(['/fight', game.id]);
      },
      error: (err) => {
        console.error('Failed to join game', err);
      },
    });
  }
}
