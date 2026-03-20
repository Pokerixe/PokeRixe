import {Component, signal} from '@angular/core';
import {Card} from '../../shared/components/card/card';

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
  ],
  templateUrl: './equipes.html',
  styleUrl: './equipes.css',
})
export class Equipes {
  public Mode = EquipeMode;
  public selectedMode: EquipeMode = EquipeMode.AUCUN;

  public selected_card = signal<number>(0);

  public team = signal<(number | null)[]>([null, null, null, null, null, null]);

  public choixPokemons = [
    { id: 1, name: 'Bulbizarre', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png' },
    { id: 4, name: 'Salamèche', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png' },
    { id: 7, name: 'Carapuce', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png' },
    { id: 25, name: 'Pikachu', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png' },
  ];

  get cardState(): number {
    return this.selected_card();
  }

  cycleMode() {
    const modes = Object.values(EquipeMode) as EquipeMode[];
    const idx = modes.indexOf(this.selectedMode);
    this.selectedMode = modes[(idx + 1) % modes.length];
  }

  setMode(mode: EquipeMode) {
    this.selectedMode = mode;
  }

  toggleCard(index: number) {
    const currentSelected = this.selected_card();

    if (currentSelected === index) {
      this.selected_card.set(0);
      this.selectedMode = EquipeMode.AUCUN;
      return;
    }

    this.selected_card.set(index);

    const slotIndex = index - 1;
    const teamSnapshot = this.team();
    if (teamSnapshot[slotIndex] !== null) {
      // Carte deja remplie: on passe directement en affichage
      this.selectedMode = EquipeMode.AFFICHAGE_POKEMON;
    } else {
      // Carte vide: on reste en choix pokemon
      this.selectedMode = EquipeMode.CHOIX_POKEMON;
    }
  }

  choosePokemon(pokedexId: number) {
    const slot = this.selected_card();
    if (!slot) {
      return;
    }

    const current = this.team();
    const updated = [...current];
    updated[slot - 1] = pokedexId;
    this.team.set(updated);

    this.selectedMode = EquipeMode.AFFICHAGE_POKEMON;
  }
}
