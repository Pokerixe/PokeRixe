import {Component, inject, OnInit} from '@angular/core';
import {PokemonService} from '../../shared/services/pokemon.service';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})

export class Home implements OnInit{
  private readonly pokemonService = inject(PokemonService);

  ngOnInit() {
    this.pokemonService.getFirst150().subscribe({
      next: (pokemons) => console.log('✅ Pokémons récupérés :', pokemons),
      error: (err) => console.error('❌ Erreur :', err)
    });
  }
}
