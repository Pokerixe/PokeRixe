/**
 * Représente une attaque (capacité) d'un Pokémon.
 *
 * @property name - Identifiant de l'attaque (ex: `"flamethrower"`)
 * @property type - Type de l'attaque (ex: `"fire"`, `"water"`)
 * @property power - Puissance de base de l'attaque, ou `null` si l'attaque n'inflige pas de dégâts
 * @property accuracy - Précision de l'attaque en pourcentage (0-100), ou `null` si infaillible
 * @property damageClass - Classe de dégâts : `"physical"`, `"special"` ou `"status"`
 */
export interface Move {
  id?: number;
  name: string;
  frenchName: string;
  type: string;
  power: number | null;
  accuracy: number | null;
  damageClass: string;
}

