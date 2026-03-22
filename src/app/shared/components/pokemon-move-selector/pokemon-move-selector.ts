import { Component } from '@angular/core';
import {Move} from '../move/move';

@Component({
  selector: 'app-pokemon-move-selector',
  imports: [
    Move
  ],
  templateUrl: './pokemon-move-selector.html',
  styleUrl: './pokemon-move-selector.css',
})
export class PokemonMoveSelector {

}
