import {Component, Input} from '@angular/core';
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

/**
 * Composant de carte pour afficher les informations d'un Pokémon.
 * Accepte les propriétés suivantes :
 * - name : Le nom du Pokémon.
 * - pokedex_id : L'identifiant du Pokémon dans le Pokédex.
 * - sprite : L'URL de l'image du Pokémon.
 * - types : Un tableau de types du Pokémon (peut être des objets complets).
 */
export class Card {

  @Input() name: string = '';
  @Input() pokedex_id: number = 0;
  @Input() sprite: string = '';
  @Input() types: string[] = []; // Accepte les objets complets
}
