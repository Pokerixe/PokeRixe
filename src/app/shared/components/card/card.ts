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
 * Carte générique pour afficher un Pokémon.
 *
 * Deux modes d'utilisation :
 * - **Mode Pokédex** (`redirect = true`) : un clic navigue vers la fiche détaillée `/pokemon/:id`.
 * - **Mode sélection** (`sendData = true`) : un clic émet `sendCardData` avec les données de la carte
 *   (utilisé dans la gestion d'équipe pour choisir un Pokémon).
 *
 * @example
 * ```html
 * <!-- Mode Pokédex -->
 * <app-card [redirect]="true" [name]="p.name" [pokedex_id]="p.id" [sprite]="p.sprite" [types]="p.types" />
 *
 * <!-- Mode sélection -->
 * <app-card [sendData]="true" [name]="p.name" [pokedex_id]="p.id" [sprite]="p.sprite"
 *           [types]="p.types" [stats]="p.stats" (sendCardData)="onCardSelected($event)" />
 * ```
 */
export class Card {

  /** Position de la carte dans la grille du Pokédex (utilisé pour l'événement `interrogationChange`). */
  cardNumber = input<number>(-1);
  /** Si `true`, la carte est cliquable et navigue vers `/pokemon/:pokedex_id`. */
  redirect = input<boolean>(false);
  /** Indice de la carte actuellement sélectionnée (pour la gestion de l'état dans le parent). */
  interrogation = input<number>(0);

  /** Émis avec `cardNumber` lorsque la carte est cliquée en mode Pokédex. */
  @Output() interrogationChange = new EventEmitter<number>();

  /** Si `true`, un clic émet `sendCardData` au lieu de naviguer. */
  sendData = input<boolean>(false);
  /** Émis avec les données du Pokémon lorsque la carte est cliquée en mode sélection. */
  @Output() sendCardData = new EventEmitter<PokemonCardModel>();

  /** Nom du Pokémon. */
  name = input<string>('');
  /** Numéro du Pokédex. */
  pokedex_id = input<number>(0);
  /** URL du sprite face avant. */
  sprite = input<string>('');
  /** Types du Pokémon (ex: `["fire", "flying"]`). */
  types = input<string[]>([]);
  /** Statistiques du Pokémon (nécessaires en mode sélection pour initialiser un slot d'équipe). */
  stats = input<any>();

  /**
   * Gère le clic sur la carte.
   * Délègue à `onClickSendData` si `sendData` est actif, sinon émet `interrogationChange`.
   */
  onClick() {
    if (this.sendData()) {
      this.onClickSendData();
    } else {
      this.interrogationChange.emit(this.cardNumber());
    }
  }

  /**
   * Émet les données du Pokémon sous forme de `PokemonCardModel` via `sendCardData`.
   */
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
