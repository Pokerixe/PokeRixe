import {
  AfterViewInit,
  Component,
  ComponentRef, DestroyRef,
  effect, EffectRef,
  inject,
  OnInit,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import {Card} from '../../shared/components/card/card';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {ApiPokemons} from '../../shared/services/api-pokemons';
import {PokemonService} from '../../shared/services/pokemon.service';
import {Pokemon} from '../../shared/models/pokemon.model';
import {PokemonStore} from '../../core/store/pokemon.store';

@Component({
  selector: 'app-pokedex',
  imports: [],
  templateUrl: './pokedex.html',
  styleUrl: './pokedex.css',
})

export class Pokedex implements AfterViewInit {
  private store = inject(PokemonStore);
  private destroyRef = inject(DestroyRef);

  @ViewChild('pokemonContainer', { read: ViewContainerRef })
  pokemonContainer!: ViewContainerRef;

  private pokemonEffect!: EffectRef;

  constructor() {
    this.pokemonEffect = effect(() => {
      const pokemons = this.store.pokemons();
      if (!this.pokemonContainer || pokemons.length === 0) return;
      this.pokemonContainer.clear();
      pokemons.forEach(p => this.addPokemonCard(p));
    });

    this.destroyRef.onDestroy(() => this.pokemonEffect.destroy());
  }

  ngAfterViewInit(): void {
    this.store.loadFirst150();

    const pokemons = this.store.pokemons();
    if (pokemons.length > 0) {
      this.pokemonContainer.clear();
      pokemons.forEach(p => this.addPokemonCard(p));
    }
  }

  private addPokemonCard(pokemon: Pokemon): void {
    const cardRef: ComponentRef<Card> = this.pokemonContainer.createComponent(Card);
    cardRef.setInput('name', pokemon.name);
    cardRef.setInput('sprite', pokemon.image);
    cardRef.setInput('pokedex_id', pokemon.id.toString());
    cardRef.setInput('types', pokemon.types);
  }
}
