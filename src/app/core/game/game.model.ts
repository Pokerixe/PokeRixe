
export interface Game {
  id: number;
  player1: string;
  player2: string | null;
  description?: string;
  nombrePokemon?: number;
}
