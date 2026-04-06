import {PokemonStats} from '../../shared/models/pokemon-stats.model';

/**
 * Attaque assignée à un Pokémon de l'équipe.
 *
 * @property slot - Position de l'attaque dans le set du Pokémon (0 à 3)
 * @property name - Identifiant de l'attaque (ex: `"flamethrower"`)
 * @property type - Type de l'attaque
 * @property power - Puissance de base, ou `null` si l'attaque n'inflige pas de dégâts
 * @property accuracy - Précision en pourcentage (0-100)
 * @property damageClass - Classe de dégâts : `"physical"`, `"special"` ou `"status"`
 */
export interface TeamMove {
  slot: 0 | 1 | 2 | 3;
  name: string;
  type: string;
  power: number | null;
  accuracy: number;
  damageClass: string;
}

/**
 * Pokémon occupant un slot de l'équipe, avec ses statistiques et attaques configurées.
 *
 * @property slotIndex - Position dans l'équipe (0 à 5)
 * @property pokedexId - Numéro du Pokédex
 * @property name - Nom du Pokémon
 * @property sprite - URL du sprite face avant
 * @property spriteBack - URL du sprite dos (utilisé en combat)
 * @property types - Liste des types du Pokémon
 * @property moves - Les 4 attaques sélectionnées
 * @property hp - Points de vie actuels
 * @property hpMax - Points de vie maximum
 * @property stats - Statistiques de base du Pokémon
 */
export interface TeamSlot {
  slotIndex: 0 | 1 | 2 | 3 | 4 | 5;
  pokedexId: number;
  name: string;
  sprite: string;
  spriteBack: string;
  types: string[];
  moves: TeamMove[];
  hp: number;
  hpMax: number;
  stats: PokemonStats;
}

/**
 * Équipe complète d'un utilisateur, composée de 6 slots (certains pouvant être vides).
 *
 * @property userId - Identifiant de l'utilisateur propriétaire de l'équipe
 * @property slots - Tableau de 6 slots, chaque slot étant un `TeamSlot` ou `null`
 * @property firstPokemon - Index du slot du Pokémon qui combat en premier (tête d'équipe)
 */
export interface Team {
  userId: string;
  slots: (TeamSlot | null)[];
  firstPokemon: number;
}
