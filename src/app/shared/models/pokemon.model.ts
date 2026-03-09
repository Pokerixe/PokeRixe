export interface PokemonStat {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface Pokemon {
  id: number;
  name: string;
  types: string[];
  image: string;
  height: number;
  weight: number;
  stats: PokemonStat;
  moves: string[];
}
