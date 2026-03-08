import {PokeStats} from './pokeStats';
import {pokeType} from './pokeType';

export class Pokemon{
  order: number | undefined;
  id: number | undefined;
  image: string | undefined;
  sprite: string | undefined;
  spriteBack: string | undefined;
  name: string | undefined;
  height: number | undefined;
  weight: number | undefined;
  types: pokeType[] | undefined;
  abilities: string[] | undefined;
  stats: PokeStats | undefined;
}
