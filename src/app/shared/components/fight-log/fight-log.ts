import { Component, effect, ElementRef, input, ViewChild } from '@angular/core';
import { TurnEvent } from '../../../core/fight/fight.model';

@Component({
  selector: 'app-fight-log',
  imports: [],
  templateUrl: './fight-log.html',
  styleUrl: './fight-log.css',
})
export class FightLog {
  events = input<TurnEvent[]>([]);

  @ViewChild('logContainer') private logContainer!: ElementRef<HTMLElement>;

  constructor() {
    effect(() => {
      this.events();
      setTimeout(() => {
        const el = this.logContainer?.nativeElement;
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      });
    });
  }
}
