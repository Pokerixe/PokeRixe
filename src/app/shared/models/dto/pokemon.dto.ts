
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
  moves: RawMoveDTO[]; // ← ici
  sprites: {
    front_default: string;
    other: {
      'official-artwork': {
        front_default: string;
      };
    };
  };
}
