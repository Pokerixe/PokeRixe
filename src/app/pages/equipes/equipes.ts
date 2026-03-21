import {
  Component,
  ComponentRef,
  DestroyRef,
  effect,
  inject,
  OnInit,
  signal,
  ViewChild,
  ViewContainerRef,
  AfterViewInit
} from '@angular/core';
import {Card} from '../../shared/components/card/card';
import {PokemonStore} from '../../core/store/pokemon.store';
import {Pokemon} from '../../shared/models/pokemon.model';
import {PokemonCardList} from '../../shared/components/pokemon-card-list/pokemon-card-list';
import {PokemonCardModel} from '../../shared/models/pokemon.card.model';

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
  ],
  templateUrl: './equipes.html',
  styleUrl: './equipes.css',
})
export class Equipes {

  public Mode = EquipeMode;

  // selectedMode devient un signal au lieu d une simple propriete
  public selectedMode = signal<EquipeMode>(EquipeMode.AUCUN);

  public selected_card = signal<number>(0);
  public team = signal<(PokemonCardModel | null)[]>([null, null, null, null, null, null]);

  get cardState(): number {
    return this.selected_card();
  }

  cycleMode() {
    const modes = Object.values(EquipeMode) as EquipeMode[];
    const idx = modes.indexOf(this.selectedMode());
    this.selectedMode.set(modes[(idx + 1) % modes.length]);
  }

  setMode(mode: EquipeMode) {
    const previous = this.selectedMode();
    this.selectedMode.set(mode);
    if (mode === EquipeMode.CHOIX_POKEMON && previous !== EquipeMode.CHOIX_POKEMON) {
    }
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
}
