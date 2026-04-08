import { PokemonStats } from '../../shared/models/pokemon-stats.model';

/**
 * Etat d'un Pokémon au sein du combat, visible par les deux joueurs.
 * Ne contient pas les attaques (confidentialité côté adversaire).
 */
export interface FightPokemonState {
  /** Index du slot dans l'équipe d'origine (0-5). */
  slotIndex: number;
  /** Numéro du Pokédex. */
  pokedexId: number;
  /** Nom du Pokémon. */
  name: string;
  /** URL du sprite face avant (utilisé pour l'adversaire). */
  sprite: string;
  /** URL du sprite dos (utilisé pour le joueur). */
  spriteBack: string;
  /** Types du Pokémon (ex: ['fire', 'flying']). */
  types: string[];
  /** Points de vie actuels. */
  hp: number;
  /** Points de vie maximum. */
  hpMax: number;
  /** `true` si le Pokémon est K.O. (hp <= 0). */
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
 * Etat complet du combat tel que retourné par `GET /games/:id/state`.
 * Représente le point de vue du joueur courant.
 */
export interface FightState {
  /** Identifiant de la partie. */
  gameId: number;
  /** Numéro du tour courant (commence à 1). */
  turnNumber: number;
  /** Phase courante du combat. */
  phase: FightPhase;

  /** Nom du joueur courant. */
  playerName: string;
  /** Pokémon actif du joueur (celui qui combat). */
  playerActivePokemon: FightPokemonState;
  /** Équipe complète du joueur avec leur état courant (pour l'UI de switch). */
  playerTeam: FightPokemonState[];

  /** Nom de l'adversaire. */
  opponentName: string;
  /** Pokémon actif de l'adversaire. */
  opponentActivePokemon: FightPokemonState;
  /** Nombre de Pokémon non-K.O. restants chez l'adversaire. */
  opponentRemainingCount: number;

  /** `true` si le joueur courant a déjà soumis son action pour ce tour. */
  playerHasActed: boolean;

  /** Journal chronologique des événements survenus durant le combat. */
  log: TurnEvent[];

  /** Nom du gagnant, ou `null` si le combat n'est pas terminé. */
  winner: string | null;

  /** `true` si c'est au joueur de choisir un remplaçant (phase `waiting_switch`). */
  mustSwitch: boolean;
}

/** Type d'un événement dans le journal de combat. */
export type TurnEventType = 'turn_start' | 'attack' | 'damage' | 'faint' | 'switch' | 'fight_end';

/**
 * Événement individuel dans le journal de combat.
 */
export interface TurnEvent {
  /** Numéro du tour auquel cet événement appartient. */
  turn: number;
  /** Type de l'événement. */
  type: TurnEventType;
  /** Message lisible affiché dans le journal. */
  message: string;
}

/** Type d'action que le joueur peut envoyer au serveur. */
export type FightActionType = 'attack' | 'switch';

/**
 * Action envoyée par le joueur via `POST /games/:id/action`.
 * Inclut les données d'attaque (stats + move) pour que le serveur puisse calculer les dégâts.
 */
export interface FightAction {
  /** Type de l'action. */
  type: FightActionType;
  /** Présent si `type === 'attack'`. */
  attack?: {
    /** Index du move dans le set du Pokémon actif (0-3). */
    moveSlot: number;
    /** Nom de l'attaque. */
    moveName: string;
    /** Type de l'attaque. */
    moveType: string;
    /** Puissance de base (null pour les moves de statut). */
    movePower: number | null;
    /** Précision en pourcentage. */
    moveAccuracy: number;
    /** Classe de dégâts : 'physical', 'special' ou 'status'. */
    moveDamageClass: string;
    /** Stats du Pokémon attaquant (pour le calcul serveur). */
    attackerStats: PokemonStats;
    /** Types du Pokémon attaquant (pour les bonus STAB côté serveur). */
    attackerTypes: string[];
  };
  /** Présent si `type === 'switch'`. */
  switch?: {
    /** Index du slot du Pokémon remplaçant dans l'équipe (0-5). */
    switchToSlotIndex: number;
  };
}

/**
 * Réponse du serveur après la soumission d'une action.
 */
export interface FightActionResponse {
  /** `true` si l'action a été acceptée et enregistrée. */
  accepted: boolean;
  /** Message d'erreur si l'action a été refusée. */
  reason?: string;
}
