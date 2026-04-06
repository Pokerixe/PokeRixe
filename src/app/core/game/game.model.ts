
export enum GameStatus {
  Waiting = 'waiting',
  InProgress = 'in_progress',
  Finished = 'finished',
}

export interface Game {
  id: number;
  player1: string;
  player2: string | null;
  description?: string;
  nombrePokemon?: number;
  status: GameStatus;
}

export interface CreateGameDTO {
  description: string;
  nombrePokemon: number;
}
