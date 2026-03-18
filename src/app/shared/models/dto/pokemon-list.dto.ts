/**
 * DTO (Data Transfer Object) for the response from the Pokémon API when fetching a list of Pokémon.
 * This interface defines the structure of the data returned by the API, including:
 * - count: The total number of Pokémon available in the API.
 */
export interface PokemonListDTO {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<{
    name: string;
    url: string;
  }>;
}
