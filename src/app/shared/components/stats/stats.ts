import {Component, Input} from '@angular/core';
import {ProgressBar} from '../progress-bar/progress-bar';
import {PokemonStats} from '../../models/pokemon-stats.model';

@Component({
  selector: 'app-stats',
  imports: [
    ProgressBar
  ],
  templateUrl: './stats.html',
  styleUrl: './stats.css',
})
export class Stats {
  @Input() stats: PokemonStats = {} as PokemonStats; // Typage explicite
  //statistiques  = new PokemonStats();

  ngOnInit() {
    console.log("baba",this.stats);
  }

}
