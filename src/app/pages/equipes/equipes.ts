import { Component } from '@angular/core';
import {Card} from '../../shared/components/card/card';

export enum EquipeMode {
  CHOIX_ATTACK = 'choix attack',
  CHOIX_POKEMON = 'choix pokemon',
  AFFICHAGE_POKEMON = 'affichage pokemon'
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
  public selectedMode: EquipeMode = EquipeMode.CHOIX_POKEMON;

  cycleMode() {
    const modes = Object.values(EquipeMode) as EquipeMode[];
    const idx = modes.indexOf(this.selectedMode);
    this.selectedMode = modes[(idx + 1) % modes.length];
  }

  setMode(mode: EquipeMode) {
    this.selectedMode = mode;
  }

}
