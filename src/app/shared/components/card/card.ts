import {Component, EventEmitter, input, OnInit, Output} from '@angular/core';
import {Type} from '../type/type';
import {RouterLink} from '@angular/router';
import {NgTemplateOutlet} from '@angular/common';
import {PokemonCardModel} from '../../models/pokemon.card.model';

@Component({
  selector: 'app-card',
  imports: [
    Type,
    RouterLink,
    NgTemplateOutlet
  ],
  templateUrl: './card.html',
  styleUrl: './card.css',
})

/**
 * Composant de carte pour afficher les informations d'un Pokémon.
 * Accepte les propriétés suivantes :
 * @param redirect : Boolean Es ce que la carte doit rediriger vers une page de détails du Pokémon lorsqu'elle est cliquée.
 * @param name : string Le nom du Pokémon.
 * @param pokedex_id : number Numéro du Pokédex du Pokémon.
 * @param sprite : String de l'image du Pokémon.
 * @param types : type[] des types du Pokémon.
 */
export class Card {

  cardNumber = input<number>(-1); // Pour les cartes dans pokedex

  redirect = input<boolean>(false);
  interrogation = input<number>(0);

  @Output() interrogationChange = new EventEmitter<number>();

  sendData = input<boolean>(false);
  @Output() sendCardData = new EventEmitter<PokemonCardModel>();

  name = input<string>('');
  pokedex_id = input<number>(0);
  sprite = input<string>('');
  types = input<string[]>([]);
  stats = input<any>();

  onClick() {
    if (this.sendData()) {
      this.onClickSendData();
    } else {
      this.interrogationChange.emit(this.cardNumber());
    }
  }

  onClickSendData() {
    this.sendCardData.emit({
      pokedex_id: this.pokedex_id(),
      name: this.name(),
      types: this.types(),
      sprite: this.sprite(),
      stats: this.stats(),
    });
  }
}
