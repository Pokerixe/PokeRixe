import {Component, Input, OnInit} from '@angular/core';
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

/**
 * Non utilisé
 * composant pour afficher les stats d'un pokemon avec des progress-bar
 */
export class Stats implements OnInit {
  @Input() stats: PokemonStats = {} as PokemonStats;

  ngOnInit() {
  }

}
