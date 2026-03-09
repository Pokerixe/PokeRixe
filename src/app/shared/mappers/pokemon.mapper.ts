import {RawPokemonDTO} from '../models/dto/pokemon.dto';
import {Pokemon} from '../models/pokemon.model';

export class PokemonMapper {
  static toModel(dto: RawPokemonDTO): Pokemon {
    return {
      id: dto.id,
      name: dto.name,
      types: dto.types.map(t => t.type.name),
      image: dto.sprites?.other?.['official-artwork']?.front_default,
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
