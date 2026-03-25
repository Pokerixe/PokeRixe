import {PokemonStats} from '../../shared/models/pokemon-stats.model';

export interface TeamMove {
  slot: 0 | 1 | 2 | 3;
  name: string;
  type: string;
  power: number | null;
  accuracy: number;
  damageClass: string;
}

export interface TeamSlot {
  slotIndex: 0 | 1 | 2 | 3 | 4 | 5;
  pokedexId: number;
  name: string;
  sprite: string;
  spriteBack: string;
  types: string[];
  moves: TeamMove[];
  hp: number;
  hpMax: number;
  stats: PokemonStats;
}

export interface Team {
  userId: string;
  slots: (TeamSlot | null)[];
  firstPokemon: number;
}
