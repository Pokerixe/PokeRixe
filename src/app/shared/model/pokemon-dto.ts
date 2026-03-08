
export interface PokemonDto {
  id: number;
  order: number;
  name: string;
  height: number;
  weight: number;
  sprites?: {
    front_default?: string;
    back_default?: string;
    other?: {
      'official-artwork'?: {
        front_default?: string;
      };
    };
  };
  types?: Array<{
    slot: number;
    type: {
      name: string;
      url: string;
    };
  }>;
  abilities?: Array<{
    ability: {
      name: string;
      url: string;
    };
  }>;
  stats?: Array<{
    base_stat: number;
    stat: {
      name: string;
      url: string;
    };
  }>;
}

export interface PokemonListDto {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<{
    name: string;
    url: string;
  }>;
}
