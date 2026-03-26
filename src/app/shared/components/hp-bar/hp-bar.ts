import {Component, computed, effect, input, signal} from '@angular/core';

@Component({
  selector: 'app-hp-bar',
  standalone: true,
  imports: [],
  templateUrl: './hp-bar.html',
  styleUrl: './hp-bar.css',
})
export class HpBar {
  // HP courant du Pokémon
  hp = input<number>();
  // HP maximum du Pokémon
  hpMax = input<number>();

  // Pourcentage de vie, calculé à partir de hp et hpMax
  percentage = computed(() => {
    const current = this.hp();
    const max = this.hpMax();

    if (max == null || max <= 0 || current == null || isNaN(current)) {
      return 0;
    }

    const ratio = (current / max) * 100;
    return Math.min(100, Math.max(0, Math.round(ratio)));
  });

  width = computed(() => this.percentage());

  colorClass = computed(() => {
    const value = this.width();
    if (value <= 10) {
      return 'hp-red';
    }
    if (value <= 40) {
      return 'hp-orange';
    }
    return 'hp-green';
  });

  isAnimating = signal(false);

  constructor() {
    effect(() => {
      this.hp();
      this.hpMax();
      this.triggerAnimation();
    });
  }

  private triggerAnimation() {
    this.isAnimating.set(false);
    queueMicrotask(() => {
      this.isAnimating.set(true);
      setTimeout(() => this.isAnimating.set(false), 350);
    });
  }
}
