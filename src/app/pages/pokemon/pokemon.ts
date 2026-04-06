import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Type} from '../../shared/components/type/type';
import {StarStats} from '../../shared/components/star-stats/star-stats';
import {PokemonService} from '../../shared/services/pokemon.service';
import {Move as MoveComponent} from '../../shared/components/move/move';
import {Move as MoveModel} from '../../shared/models/move.model';

@Component({
  selector: 'app-pokemon',
  imports: [
    Type,
    StarStats,
    MoveComponent
  ],
  templateUrl: './pokemon.html',
  styleUrl: './pokemon.css',
})
/**
 * Page de fiche détaillée d'un Pokémon.
 * L'ID est lu depuis les paramètres de route (`/pokemon/:id`).
 * Charge en parallèle : les données du Pokémon avec ses attaques, et sa description en anglais.
 */
export class PokemonPage implements OnInit {
  private readonly pokemonService = inject(PokemonService);

  constructor(private readonly route: ActivatedRoute,
              private readonly cdr: ChangeDetectorRef
  ) {
  }

  types: any;

  /** `true` tant que les données du Pokémon sont en cours de chargement. */
  isLoading: boolean = true;
  /** Données complètes du Pokémon chargé depuis l'API. */
  pokemon: any;

  /** Liste des attaques du Pokémon (filtrées : power > 30, classe physique ou spéciale). */
  moves: MoveModel[] = [];

  /** Description flavor-text en anglais, récupérée depuis l'endpoint `pokemon-species`. */
  description: string = '';

  /**
   * Récupère les informations du Pokémon
   */
  ngOnInit() {
    const id = String(this.route.snapshot.paramMap.get('id'));
    // utiliser getByIdWithMoves pour récupérer pokemon + moves
    this.pokemonService.getByIdWithMoves(Number(id)).subscribe(({pokemon, moves}) => {
      this.pokemon = pokemon;
      this.moves = moves || [];
      this.isLoading = false;
      console.log('loaded pokemon : ', this.pokemon);
      console.log('loaded moves : ', this.moves);
      this.cdr.detectChanges();
    });

    // récupérer la description (flavor_text en anglais) via pokemon-species
    this.pokemonService.getDescription(Number(id)).subscribe(desc => {
      this.description = desc;
      this.cdr.detectChanges();
    });

  }

}
