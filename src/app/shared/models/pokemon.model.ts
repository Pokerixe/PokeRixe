import {PokemonStats} from './pokemon-stats.model';

export interface Pokemon {
  id: number;
  name: string;
  types: string[];
  image: string;
  height: number;
  weight: number;
  stats: PokemonStats;
  moves: string[];
}
