import {
  Component,
  ComponentRef,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  ViewChild,
  ViewContainerRef,
  AfterViewInit
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

export class PokemonCardList implements AfterViewInit {
  redirect = input<boolean>(false); // Pour les cartes dans pokedex
  filterTypes = input<string[]>([]);
  cardSelected = output<PokemonCardModel>();

  private readonly store = inject(PokemonStore);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('pokemonContainer', {read: ViewContainerRef})
  pokemonContainer!: ViewContainerRef;

  private renderedCount = 0;
  private lastFilterTypes: string[] = [];

  /**
   * Effet qui observe les changements dans la liste des pokémons du store et les filtres actifs.
   * Réinitialise l'affichage si les filtres changent, sinon ajoute seulement les nouveaux pokémons.
   */
  constructor() {
    effect(() => {
      const filterTypes = this.filterTypes();
      const allPokemons = this.store.pokemons();
      if (!this.pokemonContainer) return;

      const filtered = filterTypes.length === 0
        ? allPokemons
        : allPokemons.filter(p => filterTypes.some(t => p.types.includes(t)));

      const filterChanged = !this.arraysEqual(filterTypes, this.lastFilterTypes);
      if (filterChanged) {
        this.pokemonContainer.clear();
        this.renderedCount = 0;
        this.lastFilterTypes = [...filterTypes];
      }

      // Affiche les nouveaux pokémons du batch (ou tous si filtre réinitialisé)
      filtered.slice(this.renderedCount).forEach(p => this.addPokemonCard(p));
      this.renderedCount = filtered.length;

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

  private arraysEqual(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }
}
