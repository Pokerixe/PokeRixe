import {Component, OnInit, OnDestroy, inject} from '@angular/core';
import { Subscription } from 'rxjs';
import {PokemonService} from '../../shared/services/pokemon.service';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})

export class Home {
  private pokemonService = inject(PokemonService);

  ngOnInit() {
    this.pokemonService.getFirst150().subscribe({
      next: (pokemons) => console.log('✅ Pokémons récupérés :', pokemons),
      error: (err) => console.error('❌ Erreur :', err)
    });
  }
}
