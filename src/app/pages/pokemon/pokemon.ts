import {ChangeDetectorRef, Component, inject} from '@angular/core';
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
export class PokemonPage {
  private pokemonService = inject(PokemonService);

  types: any;

  constructor(private route: ActivatedRoute,
              private cdr: ChangeDetectorRef
  ) {
  }

  isLoading: boolean = true;
  pokemon: any;

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
