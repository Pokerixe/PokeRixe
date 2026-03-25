import {
  Component,
  ComponentRef,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import {PokemonStore} from '../../../core/store/pokemon.store';
import {PokemonCardModel} from '../../models/pokemon.card.model';
import {Card} from '../card/card';


@Component({
  selector: 'app-pokemon-card-list',
  imports: [],
  templateUrl: './pokemon-card-list.html',
  styleUrl: './pokemon-card-list.css',
})
export class PokemonCardList {
  redirect = input<boolean>(false); // Pour les cartes dans pokedex
  cardSelected = output<PokemonCardModel>();

  private readonly store = inject(PokemonStore);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('pokemonContainer', {read: ViewContainerRef})
  pokemonContainer!: ViewContainerRef;

  private renderedCount = 0;

  /**
   * Effet qui observe les changements dans la liste des pokémons du store.
   * À chaque mise à jour, il affiche les nouveaux pokémons et déclenche le chargement du batch suivant si nécessaire.
   */
  constructor() {
    effect(() => {
      const pokemons = this.store.pokemons();
      if (!this.pokemonContainer) return;

      // Affiche les nouveaux pokémons du batch
      pokemons.slice(this.renderedCount).forEach(p => this.addPokemonCard(p));
      this.renderedCount = pokemons.length;

      // Dès que le batch est affiché, charge le suivant
      if (this.store.hasMore() && !this.store.loading()) {
        this.store.loadNextBatch();
      }
    });

    this.destroyRef.onDestroy(() => {
      this.renderedCount = 0;
      this.pokemonContainer?.clear();
    });
  }

  /**
   * Au chargement de la vue, réinitialise le store et charge les 150 premiers pokémons
   */
  ngAfterViewInit(): void {
    this.store.reset();
    this.store.loadFirst150();
  }


  /**
   * Crée une carte pour un pokémon et l'ajoute au conteneur.
   * On passe aussi un lien de navigation pour que la card puisse être entourée
   * d'une balise <a [routerLink]="..."> dans son propre template.
   */
  private addPokemonCard(pokemon: any): void {
    const cardRef: ComponentRef<Card> = this.pokemonContainer.createComponent(Card);

    if (this.redirect()) {
      cardRef.setInput('redirect', true);
    }
    cardRef.setInput('sendData', true); // active le mode envoi
    cardRef.setInput('name', pokemon.name);
    cardRef.setInput('sprite', pokemon.image);
    cardRef.setInput('pokedex_id', pokemon.id);
    cardRef.setInput('types', pokemon.types);
    cardRef.setInput('stats', pokemon.stats);

    cardRef.instance.sendCardData.subscribe(data => {
      this.cardSelected.emit(data);
    });
  }
}
