import {Component, Input} from '@angular/core';
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
  @Input() name: string = 'Draco-Rage';
  @Input() damage_class: string = 'Physique';
  @Input() power: number = 90;
  @Input() accuracy: number = 100;
  @Input() type: string = 'normal';
}
