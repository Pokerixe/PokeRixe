/**
 * Statut d'une partie multijoueur.
 *
 * - `Waiting` : en attente d'un deuxième joueur
 * - `InProgress` : combat en cours
 * - `Finished` : combat terminé
 */
export enum GameStatus {
  Waiting = 'waiting',
  InProgress = 'in_progress',
  Finished = 'finished',
}

/**
 * Représente une partie de combat entre deux joueurs.
 *
 * @property id - Identifiant unique de la partie
 * @property player1 - Identifiant ou nom du joueur 1 (créateur)
 * @property player2 - Identifiant ou nom du joueur 2, `null` si la partie attend un adversaire
 * @property description - Description optionnelle saisie par le créateur
 * @property nombrePokemon - Nombre de Pokémon engagés dans la partie
 * @property status - État actuel de la partie (`waiting`, `in_progress`, `finished`)
 */
export interface Game {
  id: number;
  player1: string;
  player2: string | null;
  description?: string;
  nombrePokemon?: number;
  status: GameStatus;
}

/**
 * Données nécessaires pour créer une nouvelle partie.
 *
 * @property description - Description courte de la partie (visible dans le lobby)
 * @property nombrePokemon - Nombre de Pokémon que chaque joueur engage
 */
export interface CreateGameDTO {
  description: string;
  nombrePokemon: number;
}
