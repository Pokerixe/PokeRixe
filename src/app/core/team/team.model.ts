export interface TeamMove {
  slot: 1 | 2 | 3 | 4;
  name: string;
  type: string;
  power: number | null;
  accuracy: number;
  damageClass: string;
}

export interface TeamSlot {
  slotIndex: 1 | 2 | 3 | 4 | 5 | 6;
  pokedexId: number;
  name: string;
  sprite: string;
  types: string[];
  moves: TeamMove[];
}

export interface Team {
  userId: string;
  slots: (TeamSlot | null)[];
}
