import { TurnEvent } from '../fight/fight.model';

export type GameResult = 'win' | 'loss';

export interface HistoryPokemon {
  pokedexId: number;
  name: string;
  sprite: string;
  isFainted: boolean;
}

export interface GameHistoryEntry {
  id: number;
  date: string;
  opponentName: string;
  result: GameResult;
  turnCount: number;
  playerTeam: HistoryPokemon[];
  opponentTeam: HistoryPokemon[];
  log: TurnEvent[];
}
