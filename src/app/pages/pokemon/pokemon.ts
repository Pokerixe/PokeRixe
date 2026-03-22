import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Type} from '../../shared/components/type/type';
import {StarStats} from '../../shared/components/star-stats/star-stats';
import {PokemonService} from '../../shared/services/pokemon.service';

@Component({
  selector: 'app-pokemon',
  imports: [
    Type,
    StarStats
  ],
  templateUrl: './pokemon.html',
  styleUrl: './pokemon.css',
})
export class PokemonPage implements OnInit {
  private readonly pokemonService = inject(PokemonService);

  constructor(private readonly route: ActivatedRoute,
              private readonly cdr: ChangeDetectorRef
  ) {
  }

  types: any;

  isLoading: boolean = true;
  pokemon: any;

  /**
   * Récupère les informations du Pokémon
   */
  ngOnInit() {
    const id = String(this.route.snapshot.paramMap.get('id'));
    this.pokemonService.getById(Number(id)).subscribe(pokemon => {
      this.pokemon = pokemon;
      this.isLoading = false;
      console.log("loaded pokemon : ", this.pokemon);
      this.cdr.detectChanges();
    });

  }

}
