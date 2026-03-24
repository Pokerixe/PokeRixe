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
export class Move {

  inFight = input<boolean>(false);

  isDefined= input<boolean>(false);

  name = input<string>('Draco-Rage');
  damage_class = input<string>('Physique');
  power = input<number>(90);
  accuracy = input<number>(100);
  type = input<string>('Dragon');

  @Output() changeMove = new EventEmitter<boolean>();

  onCLick() {
    this.changeMove.emit(true);
  }
}
