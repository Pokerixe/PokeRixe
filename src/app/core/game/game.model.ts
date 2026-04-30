import {Team} from '../team/team.model';
import {Pokemon} from '../../shared/models/pokemon.model';

/**
 * Statut d'une partie multijoueur.
 *
 * - `Waiting` : en attente d'un deuxième joueur
 * - `InProgress` : combat en cours
 */
export enum GameStatus {
  Waiting = 'WAITING',
  InProgress = 'PLAYING',
}


/**
 * Représente une partie de combat entre deux joueurs.
 *
 * @property id - Identifiant unique de la partie
 * @property description - Description optionnelle saisie par le créateur
 * @property pokemonCount - Nombre de Pokémon engagés dans la partie
 * @property status - État actuel de la partie (`waiting`, `in_progress`, `finished`)
 */
export interface GamePlay {
  id: string;
  description?: string;
  analysis?: GameAnalysis;
  players: GamePlayer[];
  turns: Turn[];
}

/**
 * Représente une partie de combat entre deux joueurs.
 *
 * @property id - Identifiant unique de la partie
 * @property description - Description optionnelle saisie par le créateur
 * @property pokemonCount - Nombre de Pokémon engagés dans la partie
 * @property status - État actuel de la partie (`waiting`, `in_progress`, `finished`)
 */
export interface GamePlay {
  id: string;
  description?: string;
  pokemonCount?: number;
  analysis?: GameAnalysis;
  status: GameStatus;
  players: GamePlayer[];
  turns: Turn[];
}

export interface Turn {
  actions: Action[];
}

type Action = Attack | Switch;

export interface BaseAction<T extends string> {
  name: T;
}

export interface Attack extends BaseAction<'Attaque'> {
  apiUrl: string;
  attacker: Pokemon;
  target: Pokemon;
}

export interface Switch extends BaseAction<'switch'> {
  player: GamePlayer;
  nextPokemon: Pokemon;
}


export interface GamePlayer {
  id: string;
  pseudo: string;
  team: Team;
  selectedPokemon: Pokemon | null;
}

export interface GameAnalysis {
  id: string;
  score: number;
  scoresByTurn: Record<number, number>;
  advice: string;
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
