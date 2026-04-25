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

  private lastEventCount = 0;

  constructor() {
    effect(() => {
      const events = this.events();
      if (events.length > this.lastEventCount) {
        this.lastEventCount = events.length;
        setTimeout(() => {
          const el = this.logContainer?.nativeElement;
          if (el) el.scrollTop = el.scrollHeight;
        });
      }
    });
  }
}
