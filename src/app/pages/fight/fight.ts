import { Component } from '@angular/core';
import {Move} from '../../shared/components/move/move';
import {FightLog} from '../../shared/components/fight-log/fight-log';
import {FightPokemonCard} from '../../shared/components/fight-pokemon-card/fight-pokemon-card';
import {test} from 'vitest';

@Component({
  selector: 'app-fight',
  imports: [
    Move,
    FightLog,
    FightPokemonCard
  ],
  templateUrl: './fight.html',
  styleUrl: './fight.css',
})
export class Fight {

  protected readonly test = test;
}
