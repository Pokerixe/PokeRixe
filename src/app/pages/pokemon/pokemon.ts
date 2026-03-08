import {ChangeDetectorRef, Component} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ApiPokemons} from '../../shared/services/api-pokemons';
import {Stats} from '../../shared/components/stats/stats';
import {Type} from '../../shared/components/type/type';
import {StarStats} from '../../shared/components/star-stats/star-stats';

@Component({
  selector: 'app-pokemon',
  imports: [
    Type,
    StarStats
  ],
  templateUrl: './pokemon.html',
  styleUrl: './pokemon.css',
})
export class Pokemon {

  constructor(private route: ActivatedRoute,
              private apiPokemon : ApiPokemons,
              private cdr : ChangeDetectorRef
  ) {}

  isLoading : boolean = true;
  pokemon : any;

  ngOnInit() {
    const id = String(this.route.snapshot.paramMap.get('id'));
    this.apiPokemon.getPokemon(id).subscribe({
      next: (pokemon) => {
        this.pokemon = pokemon;
        console.log(pokemon);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors de la récupération du Pokémon:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });

  }

}
