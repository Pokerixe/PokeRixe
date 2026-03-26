import {Component, input, Input} from '@angular/core';
import {HpBar} from '../hp-bar/hp-bar';

@Component({
  selector: 'app-fight-pokemon-card',
  imports: [
    HpBar
  ],
  templateUrl: './fight-pokemon-card.html',
  styleUrl: './fight-pokemon-card.css',
})
export class FightPokemonCard {

  @Input() img: string = '';
  @Input() name: string = '';
  hp = input<number>(0);
  hpMax = input<number>(0);
}
