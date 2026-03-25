
/**
 * DTO (Data Transfer Object) pour les données de Pokémon.
 * Ce DTO correspond à la structure des données retournées par l'API Pokémon.
 * Il est utilisé pour transférer les données brutes de l'API vers les modèles internes de l'application.
 * - RawMoveDTO : Représente la structure d'une attaque dans les données brutes de l'API.
 * - RawPokemonDTO : Représente la structure d'un Pokémon dans les données brutes de l'API, incluant ses mouvements, types, stats, etc.
 */
export interface RawMoveDTO {
  move: {
    name: string;
    url: string;
  };
}

export interface RawPokemonDTO {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: { type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
  moves: RawMoveDTO[];
  sprites: {
    front_default: string;
    other: {
      'official-artwork': {
        front_default: string;
      };
    };
  };
}
