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
export class Equipes {
  private readonly teamService = inject(TeamService);

  public Mode = EquipeMode;

  public selectedMode = signal<EquipeMode>(EquipeMode.AUCUN);
  public selected_card = signal<number>(0);

  readonly team = this.teamService.slots;

  public idFocusMove = signal<number>(0);

  public availableMovesForSelected: MoveModel[] = [];

  get cardState(): number {
    return this.selected_card();
  }

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

  changeMode(mode: EquipeMode) {
    this.selectedMode.set(mode);
  }

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
        {slot: 0, name: '', type: 'normal', power: null, accuracy: 100, damageClass: 'physical'},
        {slot: 1, name: '', type: 'normal', power: null, accuracy: 100, damageClass: 'physical'},
        {slot: 2, name: '', type: 'normal', power: null, accuracy: 100, damageClass: 'physical'},
        {slot: 3, name: '', type: 'normal', power: null, accuracy: 100, damageClass: 'physical'},
      ],
    };

    this.teamService.setSlot(slotIndex, teamSlot);
    this.teamService.saveTeam();

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
      slot: moveIndex as 0| 1 | 2 | 3,
      name: move.name,
      type: move.type,
      power: move.power,
      accuracy: move.accuracy ?? 100,
      damageClass: move.damageClass,
    };

    this.teamService.setMove(slotIndex, moveSlotIndex, teamMove);
    this.teamService.saveTeam();

    this.selectedMode.set(EquipeMode.AFFICHAGE_POKEMON);
  }


  protected removePokemon() {
    const slot = this.selected_card();
    if (!slot) return;

    const slotIndex = slot - 1;
    this.teamService.clearSlot(slotIndex);
    this.teamService.saveTeam();

    this.selectedMode.set(EquipeMode.AUCUN);
    this.selected_card.set(0);
    this.idFocusMove.set(0);
  }
}
