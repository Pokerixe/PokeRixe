import {Component, Input} from '@angular/core';
import {NgStyle} from '@angular/common';

@Component({
  selector: 'app-progress-bar',
  imports: [
    NgStyle
  ],
  templateUrl: './progress-bar.html',
  styleUrl: './progress-bar.css',
})
/**
 * Non utilisé
 * Barre de prgression
 */
export class ProgressBar {
  @Input () value: number = 0;
  protected readonly Math = Math;
}
