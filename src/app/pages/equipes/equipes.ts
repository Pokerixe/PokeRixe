import {
  Component, inject,
  signal,
} from '@angular/core';
import {Card} from '../../shared/components/card/card';
import {PokemonCardList} from '../../shared/components/pokemon-card-list/pokemon-card-list';
import {PokemonInformation} from '../../shared/components/pokemon-information/pokemon-information';
import {PokemonMoveSelector} from '../../shared/components/pokemon-move-selector/pokemon-move-selector';
import {TeamMove, TeamSlot} from '../../core/team/team.model';
import {TeamService} from '../../core/team/team.service';
import {PokemonCardModel} from '../../shared/models/pokemon.card.model';
import {Move as MoveModel} from '../../shared/models/move.model';

/**
 * Modes d'affichage du panneau latéral sur la page Équipes.
 *
 * - `CHOIX_POKEMON` : le joueur sélectionne un Pokémon dans le Pokédex
 * - `AFFICHAGE_POKEMON` : fiche détaillée du Pokémon du slot sélectionné
 * - `CHOIX_ATTACK` : le joueur choisit une attaque pour un slot donné
 * - `AUCUN` : aucun slot sélectionné, panneau vide
 */
export enum EquipeMode {
  CHOIX_ATTACK = 'choix attack',
  CHOIX_POKEMON = 'choix pokemon',
  AFFICHAGE_POKEMON = 'affichage pokemon',
  AUCUN = 'aucun'
}

@Component({
  selector: 'app-equipes',
  imports: [
    Card,
    PokemonCardList,
    PokemonInformation,
    PokemonMoveSelector,
  ],
  templateUrl: './equipes.html',
  styleUrl: './equipes.css',
})

/**
 * Page de gestion de l'équipe Pokémon du joueur.
 *
 * Affiche les 6 slots de l'équipe. Un clic sur un slot vide ouvre le Pokédex pour choisir
 * un Pokémon (`CHOIX_POKEMON`) ; un clic sur un slot occupé affiche la fiche du Pokémon
 * (`AFFICHAGE_POKEMON`). Depuis la fiche, le joueur peut modifier les attaques (`CHOIX_ATTACK`)
 * ou retirer le Pokémon.
 *
 * Toutes les mutations passent par `TeamService` et sont persistées via `saveTeam()`.
 */
export class Equipes {
  private readonly teamService = inject(TeamService);

  /** Référence à l'enum `EquipeMode` pour l'utiliser dans le template. */
  public Mode = EquipeMode;

  /** Mode d'affichage actuel du panneau latéral. */
  public selectedMode = signal<EquipeMode>(EquipeMode.AUCUN);
  /** Index de la carte sélectionnée (1-6, 0 = aucune). */
  public selected_card = signal<number>(0);

  /** Signal des 6 slots de l'équipe, synchronisé avec `TeamService`. */
  readonly team = this.teamService.slots;
  readonly isSaving = this.teamService.isSaving;

  /** Index du slot d'attaque en cours d'édition (1-4). */
  public idFocusMove = signal<number>(0);

  /** Attaques disponibles pour le Pokémon du slot sélectionné, chargées par `PokemonInformation`. */
  public availableMovesForSelected: MoveModel[] = [];

  /** Index de la carte sélectionnée (lecture seule, pour le template). */
  get cardState(): number {
    return this.selected_card();
  }

  /**
   * Sélectionne ou désélectionne une carte de l'équipe.
   * Adapte le mode d'affichage selon que le slot est occupé ou vide.
   * @param index Numéro de la carte (1-6)
   */
  toggleCard(index: number) {
    const currentSelected = this.selected_card();

    if (currentSelected === index) {
      this.selected_card.set(0);
      this.selectedMode.set(EquipeMode.AUCUN);
      return;
    }

    this.selected_card.set(index);

    const slotIndex = index - 1;
    const teamSnapshot = this.team();
    if (teamSnapshot[slotIndex] !== null) {
      this.selectedMode.set(EquipeMode.AFFICHAGE_POKEMON);
    } else {
      this.selectedMode.set(EquipeMode.CHOIX_POKEMON);
    }
  }

  /**
   * Change manuellement le mode d'affichage du panneau latéral.
   * @param mode Le nouveau mode à appliquer
   */
  changeMode(mode: EquipeMode) {
    this.selectedMode.set(mode);
  }

  /**
   * Assigne un Pokémon au slot actuellement sélectionné et sauvegarde l'équipe.
   * Initialise le Pokémon avec 4 slots d'attaque vides et ses HP maximum.
   * @param pokemon Données de la carte Pokémon sélectionnée
   */
  choosePokemon(pokemon: PokemonCardModel) {
    const slot = this.selected_card();
    if (!slot) return;

    const slotIndex = slot - 1;

    const maxHp = pokemon.stats.hp;

    const teamSlot: TeamSlot = {
      slotIndex: slot as 0 | 1 | 2 | 3 | 4 | 5,
      pokedexId: pokemon.pokedex_id,
      name: pokemon.name,
      sprite: pokemon.sprite,
      spriteBack: pokemon.sprite,
      types: pokemon.types,
      hp : maxHp,
      hpMax: maxHp,
      stats: pokemon.stats,
      moves: [
        // initialise les 4 slots de moves vides
        {slot: 0, name: '', frenchName: '', type: 'normal', power: null, accuracy: 100, damageClass: 'physical'},
        {slot: 1, name: '', frenchName: '', type: 'normal', power: null, accuracy: 100, damageClass: 'physical'},
        {slot: 2, name: '', frenchName: '', type: 'normal', power: null, accuracy: 100, damageClass: 'physical'},
        {slot: 3, name: '', frenchName: '', type: 'normal', power: null, accuracy: 100, damageClass: 'physical'},
      ],
    };

    this.teamService.setSlot(slotIndex, teamSlot);

    this.selectedMode.set(EquipeMode.AFFICHAGE_POKEMON);
  }

  protected onPokemonChosen(pokemon: PokemonCardModel) {
    this.choosePokemon(pokemon);
  }

  protected changeToMoveMode(idMove: number) {
    this.idFocusMove.set(idMove);
    this.changeMode(this.Mode.CHOIX_ATTACK);
  }

  protected onMovesLoaded(moves: MoveModel[]) {
    this.availableMovesForSelected = moves;
  }

  protected onMoveSelected(move: MoveModel) {
    const slot = this.selected_card();
    const moveIndex = this.idFocusMove();
    if (!slot || !moveIndex) return;

    const slotIndex = slot - 1;
    const moveSlotIndex = moveIndex - 1; // 0-based pour TeamMove[]

    const teamMove: TeamMove = {
      id: move.id,
      apiUrl: `https://pokeapi.co/api/v2/move/${move.name}/`,
      slot: moveSlotIndex as 0 | 1 | 2 | 3,
      name: move.name,
      frenchName: move.frenchName,
      type: move.type,
      power: move.power,
      accuracy: move.accuracy ?? 100,
      damageClass: move.damageClass,
    };

    this.teamService.setMove(slotIndex, moveSlotIndex, teamMove);

    this.selectedMode.set(EquipeMode.AFFICHAGE_POKEMON);
  }


  saveTeam() {
    this.teamService.saveTeam();
  }

  protected removePokemon() {
    const slot = this.selected_card();
    if (!slot) return;

    const slotIndex = slot - 1;
    this.teamService.clearSlot(slotIndex);

    this.selectedMode.set(EquipeMode.AUCUN);
    this.selected_card.set(0);
    this.idFocusMove.set(0);
  }
}
