import {Component, Input} from '@angular/core';
import {HpBar} from '../hp-bar/hp-bar';

@Component({
  selector: 'app-fight-pokemon-card',
  imports: [
  ],
  templateUrl: './fight-pokemon-card.html',
  styleUrl: './fight-pokemon-card.css',
})
export class FightPokemonCard {

  @Input() img: string = '';
  @Input() name: string = '';

}
