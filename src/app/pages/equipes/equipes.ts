import {
  Component, inject,
  signal,
} from '@angular/core';
import {Card} from '../../shared/components/card/card';
import {PokemonCardList} from '../../shared/components/pokemon-card-list/pokemon-card-list';
import {PokemonCardModel} from '../../shared/models/pokemon.card.model';
import {PokemonInformation} from '../../shared/components/pokemon-information/pokemon-information';
import {PokemonMoveSelector} from '../../shared/components/pokemon-move-selector/pokemon-move-selector';
import {Team} from '../../core/team/team.model';
import {TeamService} from '../../core/team/team.service';

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

  // selectedMode devient un signal au lieu d une simple propriete
  public selectedMode = signal<EquipeMode>(EquipeMode.AUCUN);

  public selected_card = signal<number>(0);
  public team = signal<(PokemonCardModel | null)[]>([null, null, null, null, null, null]);

  public idFocusMove = signal<number>(0);


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
      const previous = this.selectedMode();
      this.selectedMode.set(EquipeMode.CHOIX_POKEMON);

    }
  }

  changeMode(mode: EquipeMode) {
    this.selectedMode.set(mode);
  }

  choosePokemon(pokemon: PokemonCardModel) {
    const slot = this.selected_card();
    if (!slot) return;

    const current = this.team();
    const updated = [...current];
    updated[slot - 1] = pokemon;  // on stocke l'objet complet
    this.team.set(updated);

    this.selectedMode.set(EquipeMode.AFFICHAGE_POKEMON);
  }

  protected onPokemonChosen(pokemon: PokemonCardModel) {
    console.log(pokemon);
    this.choosePokemon(pokemon);  // on passe juste pokemon
  }

  protected changeToMoveMode(idMove: number) {
    this.idFocusMove.set(idMove);
    this.changeMode(this.Mode.CHOIX_ATTACK);
  }
}
