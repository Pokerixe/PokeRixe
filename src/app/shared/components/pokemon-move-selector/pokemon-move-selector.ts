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
export class PokemonMoveSelector {

  currentMove = input<MoveModel | null>(null);

  availableMoves = input<MoveModel[]>([]);

  @Output() moveSelected = new EventEmitter<MoveModel>();

  selectedMoveIndex = 0;

  onChooseMove(move: MoveModel, index: number) {
    this.selectedMoveIndex = index;
    this.moveSelected.emit(move);
  }
}
