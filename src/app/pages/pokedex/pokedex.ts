import {
  AfterViewInit, Component, ComponentRef, DestroyRef,
  effect, EffectRef, ElementRef, inject, ViewChild, ViewContainerRef
} from '@angular/core';
import {Card} from '../../shared/components/card/card';
import {Pokemon} from '../../shared/models/pokemon.model';
import {PokemonStore} from '../../core/store/pokemon.store';

@Component({
  selector: 'app-pokedex',
  imports: [],
  templateUrl: './pokedex.html',
  styleUrl: './pokedex.css',
})
export class Pokedex implements AfterViewInit {
  private readonly store = inject(PokemonStore);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('pokemonContainer', { read: ViewContainerRef })
  pokemonContainer!: ViewContainerRef;

  private renderedCount = 0;

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

    this.destroyRef.onDestroy(() => this.renderedCount = 0);
  }

  ngAfterViewInit(): void {
    this.store.loadFirst150();
  }

  private addPokemonCard(pokemon: Pokemon): void {
    const cardRef: ComponentRef<Card> = this.pokemonContainer.createComponent(Card);
    cardRef.setInput('name', pokemon.name);
    cardRef.setInput('sprite', pokemon.image);
    cardRef.setInput('pokedex_id', pokemon.id.toString());
    cardRef.setInput('types', pokemon.types);
  }
}
