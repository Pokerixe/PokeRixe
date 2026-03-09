import {Component, Input, input} from '@angular/core';
import { NgOptimizedImage} from '@angular/common';
import {RouterLink} from '@angular/router';
import {Type} from '../type/type';

@Component({
  selector: 'app-card',
  imports: [
    RouterLink,
    Type

  ],
  templateUrl: './card.html',
  styleUrl: './card.css',
})

export class Card {

  @Input() name: string = '';
  @Input() pokedex_id: number = 0;
  @Input() sprite: string = '';
  @Input() types: string[] = []; // Accepte les objets complets
}
