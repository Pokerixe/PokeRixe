export interface AttackDto {
  id?: number;
  apiUrl: string;
}

export interface PokemonDto {
  id?: number;
  apiUrl: string;
  attacks: AttackDto[];
}

export interface TeamDto {
  pokemons: PokemonDto[];
}
