import {Component, EventEmitter, input, Output} from '@angular/core';
import {Type} from '../type/type';

@Component({
  selector: 'app-move',
  imports: [
    Type
  ],
  templateUrl: './move.html',
  styleUrl: './move.css',
})
/**
 * Carte d'affichage d'une attaque Pokémon.
 * Utilisée dans la fiche Pokémon (page détail) et dans la page de combat.
 * En mode équipe, un clic émet `changeMove` pour déclencher le sélecteur d'attaque.
 *
 * @example
 * `<app-move [name]="move.name" [type]="move.type" [power]="move.power" [inFight]="false" />`
 */
export class Move {

  /** Si `true`, la carte est affichée dans l'interface de combat (style adapté). */
  inFight = input<boolean>(false);
  /** Si `true`, l'attaque est définie ; si `false`, le slot est vide et cliquable. */
  isDefined= input<boolean>(false);

  /** Nom anglais de l'attaque (identifiant backend). */
  name = input<string>('Draco-Rage');
  /** Nom français de l'attaque à afficher. Si absent, `name` est utilisé en fallback. */
  frenchName = input<string>('');
  /** Classe de dégâts : `"physical"`, `"special"` ou `"status"`. */
  damage_class = input<string>('physical');
  /** Puissance de base de l'attaque. */
  power = input<number>(90);
  /** Précision de l'attaque en pourcentage. */
  accuracy = input<number>(100);
  /** Type de l'attaque (ex: `"dragon"`, `"fire"`). */
  type = input<string>('Dragon');

  private static readonly DAMAGE_CLASS_FR: Record<string, string> = {
    physical: 'Physique',
    special: 'Spécial',
    status: 'Statut',
  };

  get displayName(): string {
    return this.frenchName() || this.name();
  }

  get frenchDamageClass(): string {
    return Move.DAMAGE_CLASS_FR[this.damage_class()] ?? this.damage_class();
  }

  /** Émis lorsque l'utilisateur clique sur la carte pour changer l'attaque. */
  @Output() changeMove = new EventEmitter<boolean>();

  onCLick() {
    this.changeMove.emit(true);
  }
}
