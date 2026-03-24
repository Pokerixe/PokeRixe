import { Component } from '@angular/core';
import {Move} from '../../shared/components/move/move';
import {FightLog} from '../../shared/components/fight-log/fight-log';

@Component({
  selector: 'app-fight',
  imports: [
    Move,
    FightLog
  ],
  templateUrl: './fight.html',
  styleUrl: './fight.css',
})
export class Fight {

}
