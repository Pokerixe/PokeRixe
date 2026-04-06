import {Component, EventEmitter, input, Output} from '@angular/core';
import {Move} from '../move/move';
import {Move as MoveModel} from '../../models/move.model';

@Component({
  selector: 'app-pokemon-move-selector',
  imports: [
    Move
  ],
  templateUrl: './pokemon-move-selector.html',
  styleUrl: './pokemon-move-selector.css',
})
/**
 * Liste déroulante permettant de sélectionner une attaque parmi celles disponibles pour un Pokémon.
 * Utilisée dans la page Équipes lorsque l'utilisateur souhaite modifier l'une des 4 attaques d'un slot.
 *
 * @example
 * `<app-pokemon-move-selector [availableMoves]="moves" (moveSelected)="onMoveSelected($event)" />`
 */
export class PokemonMoveSelector {

  /** Attaque actuellement assignée au slot (mise en évidence dans la liste). */
  currentMove = input<MoveModel | null>(null);
  /** Liste complète des attaques disponibles pour ce Pokémon (filtrées et triées par `MoveService`). */
  availableMoves = input<MoveModel[]>([]);

  /** Émis avec l'attaque choisie lorsque l'utilisateur en sélectionne une. */
  @Output() moveSelected = new EventEmitter<MoveModel>();

  /** Index de l'attaque sélectionnée dans la liste `availableMoves`. */
  selectedMoveIndex = 0;

  /**
   * Gère la sélection d'une attaque.
   * @param move L'attaque choisie
   * @param index Sa position dans la liste
   */
  onChooseMove(move: MoveModel, index: number) {
    this.selectedMoveIndex = index;
    this.moveSelected.emit(move);
  }
}
