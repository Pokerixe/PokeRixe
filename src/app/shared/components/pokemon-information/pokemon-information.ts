import {ChangeDetectorRef, Component, inject, input, OnChanges, SimpleChanges} from '@angular/core';
import {PokemonService} from '../../services/pokemon.service';
import {StarStats} from '../star-stats/star-stats';
import {Type} from '../type/type';
import {Pokemon} from '../../models/pokemon.model';
import {Stats} from '../stats/stats';
import {Move} from '../move/move';

@Component({
  selector: 'app-pokemon-information',
  imports: [
    Type,
    Stats,
    Move
  ],
  templateUrl: './pokemon-information.html',
  styleUrl: './pokemon-information.css',
})
export class PokemonInformation implements OnChanges {

  private readonly pokemonService = inject(PokemonService);

  // Id du Pokémon à charger (numéro de Pokédex)
  pokemon_id = input<number>(1);

  isLoading: boolean = true;
  error: string | null = null;

  pokemon: Pokemon | null = null;

  // Liste courte d'attaques à afficher (extraites de pokemon.moves)
  displayedMoves: string[] = [];

  constructor(private readonly cdr: ChangeDetectorRef) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pokemon_id']) {
      const id = this.pokemon_id();
      if (!id || id <= 0) {
        this.pokemon = null;
        this.displayedMoves = [];
        this.isLoading = false;
        this.error = null;
        return;
      }
      this.loadPokemon(id);
    }
  }

  private loadPokemon(id: number) {
    this.isLoading = true;
    this.error = null;
    this.pokemon = null;
    this.displayedMoves = [];

    this.pokemonService.getById(id).subscribe({
      next: (pokemon) => {
        this.pokemon = pokemon;
        // On garde par exemple les 4 premières attaques pour l'affichage
        this.displayedMoves = (pokemon.moves || []).slice(0, 4);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors du chargement du Pokémon', err);
        this.error = 'Impossible de charger ce Pokémon.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  protected readonly String = String;
  protected readonly Type = Type;
}
