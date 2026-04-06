import {PokemonStats} from './pokemon-stats.model';

/**
 * Sous-ensemble des données d'un Pokémon utilisé pour l'affichage des cartes
 * et la communication entre composants (ex: sélection dans le Pokédex ou dans la gestion d'équipe).
 *
 * @property pokedex_id - Numéro du Pokédex
 * @property name - Nom du Pokémon
 * @property types - Types du Pokémon (ex: `["fire", "flying"]`)
 * @property sprite - URL du sprite face avant
 * @property stats - Statistiques de base utilisées pour initialiser un slot d'équipe
 */
export interface PokemonCardModel {
  pokedex_id: number;
  name: string;
  types: string[];
  sprite: string;
  stats: PokemonStats;
}
