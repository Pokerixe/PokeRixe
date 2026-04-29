export interface AttackDto {
  apiUrl: string;
}

export interface PokemonDto {
  apiUrl: string;
  attacks: AttackDto[];
}

export interface TeamDto {
  pokemons: PokemonDto[];
}
