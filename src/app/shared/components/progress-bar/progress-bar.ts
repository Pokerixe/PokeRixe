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
export class ProgressBar {
  @Input () value: number = 0;
  protected readonly Math = Math;
}
