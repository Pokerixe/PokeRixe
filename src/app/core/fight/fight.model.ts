/**
 * Etat d'un Pokémon au sein du combat, visible par les deux joueurs.
 * Ne contient pas les attaques (confidentialité côté adversaire).
 */
export interface FightPokemonState {
  slotIndex: number;
  pokedexId: number;
  name: string;
  sprite: string;
  spriteBack: string;
  types: string[];
  hp: number;
  hpMax: number;
  isFainted: boolean;
}

/**
 * Phase courante du combat.
 * - `waiting_actions` : les deux joueurs doivent choisir une action
 * - `waiting_switch` : un joueur dont le Pokémon actif est K.O. doit choisir un remplaçant
 * - `finished` : le combat est terminé
 */
export type FightPhase = 'waiting_actions' | 'waiting_switch' | 'finished';

/**
 * Représente le point de vue du joueur courant.
 */
export interface FightState {
  gameId: number;
  turnNumber: number;
  phase: FightPhase;

  playerName: string;
  playerActivePokemon: FightPokemonState;
  playerTeam: FightPokemonState[];

  opponentName: string;
  opponentActivePokemon: FightPokemonState;
  opponentRemainingCount: number;

  /** `true` si le joueur courant a déjà soumis son action pour ce tour. */
  playerHasActed: boolean;

  /** `true` si c'est au joueur de choisir un remplaçant (phase `waiting_switch`). */
  mustSwitch: boolean;

  log: TurnEvent[];
  winner: string | null;
}

/** Type d'un événement dans le journal de combat. */
export type TurnEventType = 'turn_start' | 'attack' | 'damage' | 'faint' | 'switch' | 'fight_end';

/**
 * Événement individuel dans le journal de combat.
 */
export interface TurnEvent {
  turn: number;
  type: TurnEventType;
  message: string;
}

