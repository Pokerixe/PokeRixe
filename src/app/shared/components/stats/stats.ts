import {Component, Input} from '@angular/core';
import {ProgressBar} from '../progress-bar/progress-bar';
import {PokeStats} from '../../model/pokeStats';

@Component({
  selector: 'app-stats',
  imports: [
    ProgressBar
  ],
  templateUrl: './stats.html',
  styleUrl: './stats.css',
})
export class Stats {
  @Input() stats: PokeStats = {} as PokeStats; // Typage explicite
  //statistiques  = new PokemonStats();

  ngOnInit() {
    console.log("baba",this.stats);
  }

}


/*
   {
  "id": 143,
  "pokedexId": 143,
  "name": "Ronflex",
  "image": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png",
  "sprite": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/143.png",
  "slug": "Ronflex",
  "stats": {
    "HP": 160,
    "attack": 110,
    "defense": 65,
    "special_attack": 65,
    "special_defense": 110,
    "speed": 30
  },
  "apiTypes": [
    {
      "name": "Normal",
      "image": "https://static.wikia.nocookie.net/pokemongo/images/f/fb/Normal.png"
    }
  ],
  "apiGeneration": 1,
  "apiResistances": [
    {
      "name": "Normal",
      "damage_multiplier": 1,
      "damage_relation": "neutral"
    },
    {
      "name": "Combat",
      "damage_multiplier": 2,
      "damage_relation": "vulnerable"
    },

    {
      "name": "Spectre",
      "damage_multiplier": 0,
      "damage_relation": "immune"
    },

    {
      "name": "Fée",
      "damage_multiplier": 1,
      "damage_relation": "neutral"
    }
  ],
  "resistanceModifyingAbilitiesForApi": {
    "name": "Isograisse",
    "slug": "Isograisse"
  },
  "apiEvolutions": [],
  "apiPreEvolution": {
    "name": "Goinfrex",
    "pokedexIdd": 446
  },
  "apiResistancesWithAbilities": []
}
   */
