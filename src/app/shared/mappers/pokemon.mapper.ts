import {RawPokemonDTO} from '../models/dto/pokemon.dto';
import {Pokemon} from '../models/pokemon.model';

/**
 * Mapper pour convertir les données brutes de l'API Pokémon en modèles utilisables dans l'application
 */
export class PokemonMapper {
  /**
   * Transforme un DTO brut de l'API PokeAPI en modèle interne `Pokemon`.
   * Extrait et renomme les champs pertinents, mappe les statistiques dans l'ordre standard.
   * @param dto Données brutes issues de l'API
   * @returns Modèle Pokémon prêt à être utilisé dans les composants
   */
  static toModel(dto: RawPokemonDTO): Pokemon {
    return {
      id: dto.id,
      name: dto.name,
      types: dto.types.map(t => t.type.name),
      image: dto.sprites?.other?.['official-artwork']?.front_default,
      sprite: dto.sprites?.front_default ?? dto.sprites?.other?.['official-artwork']?.front_default ?? '',
      height: dto.height,
      weight: dto.weight,
      stats: {
        hp: dto.stats[0].base_stat,
        attack: dto.stats[1].base_stat,
        defense: dto.stats[2].base_stat,
        specialAttack: dto.stats[3].base_stat,
        specialDefense: dto.stats[4].base_stat,
        speed: dto.stats[5].base_stat,
      },
      moves: dto.moves.map(m => m.move.name),
    };
  }
}
