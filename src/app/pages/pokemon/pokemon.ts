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

  /** Description française, récupérée depuis l'endpoint `pokemon-species`. */
  description: string = '';

  /**
   * Récupère les informations du Pokémon (nom FR, attaques et description en un seul bloc d'appels).
   */
  ngOnInit() {
    const id = String(this.route.snapshot.paramMap.get('id'));
    this.pokemonService.getByIdWithMoves(Number(id)).subscribe(({pokemon, moves, description}) => {
      this.pokemon = pokemon;
      this.moves = moves || [];
      this.description = description;
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }

}
