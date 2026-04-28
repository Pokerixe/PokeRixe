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
 * @property gameId - Identifiant unique de la partie en UUIDv4
 * @property token - Jeton d'authentification pour la partie, à utiliser dans le websocket
 */
export interface GameCreationData {
  gameId: string;
  token: string;
}
