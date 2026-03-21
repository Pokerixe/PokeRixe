import {PokemonStats} from './pokemon-stats.model';

/**
 * Modèle de données pour un Pokémon
 * - id : Numéro de Pokédex
 * - name : Nom
 * - types : Types du Pokémon (ex: ["Fire", "Flying"])
 * - image : URL de l'image du Pokémon
 * - height : Taille du Pokémon (en décimètres)
 * - weight : Poids du Pokémon (en hectogrammes)
 * - stats : Statistiques du Pokémon (HP, Attack, Defense, etc.)
 * - moves : Liste des mouvements que le Pokémon peut apprendre
 * Modèle d'un pokémon tel qu'on le reçoit de l'API, avec les champs essentiels pour l'affichage et les détails
 */
export interface PokemonCardModel {
  pokedex_id: number;
  name: string;
  types: string[];
  sprite: string;
}
