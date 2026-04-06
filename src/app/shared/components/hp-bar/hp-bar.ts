import {Component, computed, effect, input, signal} from '@angular/core';

@Component({
  selector: 'app-hp-bar',
  standalone: true,
  imports: [],
  templateUrl: './hp-bar.html',
  styleUrl: './hp-bar.css',
})
/**
 * Barre de points de vie animée pour un Pokémon.
 * Change de couleur automatiquement selon le pourcentage restant :
 * - vert > 40 %, orange ≤ 40 %, rouge ≤ 10 %.
 * Déclenche une animation CSS à chaque modification de HP.
 *
 * @example
 * `<app-hp-bar [hp]="pokemon.hp" [hpMax]="pokemon.hpMax" />`
 */
export class HpBar {
  /** Points de vie actuels du Pokémon. */
  hp = input<number>();
  /** Points de vie maximum du Pokémon. */
  hpMax = input<number>();

  /** Pourcentage de vie restant (0-100), calculé à partir de `hp` et `hpMax`. */
  percentage = computed(() => {
    const current = this.hp();
    const max = this.hpMax();

    if (max == null || max <= 0 || current == null || isNaN(current)) {
      return 0;
    }

    const ratio = (current / max) * 100;
    return Math.min(100, Math.max(0, Math.round(ratio)));
  });

  /** Largeur de la barre en pourcentage (identique à `percentage`, exposé séparément pour le binding CSS). */
  width = computed(() => this.percentage());

  /** Classe CSS de couleur appliquée à la barre selon le pourcentage de vie. */
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
