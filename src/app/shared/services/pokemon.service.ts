import {PokemonRepository} from '../repositories/pokeApi.repository';
import {Pokemon} from '../models/pokemon.model';
import {forkJoin, map, Observable, switchMap} from 'rxjs';
import {Injectable} from '@angular/core';
import {PokemonMapper} from '../mappers/pokemon.mapper';
import {Move} from '../models/move.model';
import {MoveService} from './move.service';
import {RawPokemonDTO} from '../models/dto/pokemon.dto';

/** Extrait le nom français depuis la réponse de pokemon-species. */
function extractFrenchName(species: any): string | undefined {
  return species?.names?.find((n: any) => n.language?.name === 'fr')?.name;
}

/** Extrait la description française depuis les flavor_text_entries de pokemon-species. */
function extractFrenchDescription(species: any): string {
  if (!Array.isArray(species?.flavor_text_entries)) return '';
  const entry = species.flavor_text_entries.find((e: any) => e.language?.name === 'fr');
  if (!entry?.flavor_text) return '';
  return (entry.flavor_text as string).replace(/\f/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Service de haut niveau pour accéder aux données Pokémon.
 * Orchestre les appels à `PokemonRepository` et applique le mapping via `PokemonMapper`.
 * Pour les attaques, délègue le chargement et le filtrage à `MoveService`.
 */
@Injectable({ providedIn: 'root' })
export class PokemonService {
  constructor(
    private readonly repo: PokemonRepository,
    private readonly moveService: MoveService,
  ) {}

  /**
   * Récupère les premiers Pokémon (par défaut 150) en parallèle.
   * Chaque Pokémon est enrichi de son nom français via pokemon-species.
   * @param amount Nombre de Pokémon à charger (défaut : 150)
   */
  getFirst150(amount: number = 150): Observable<Pokemon[]> {
    return this.repo.getList(amount).pipe(
      switchMap(list =>
        forkJoin(
          list.results.map(item => {
            // Extrait l'ID depuis l'URL (ex: ".../pokemon/25/")
            const segments = item.url.split('/').filter(Boolean);
            const id = Number(segments[segments.length - 1]);
            return this.getById(id);
          })
        )
      )
    );
  }

  /**
   * Récupère un Pokémon par son numéro de Pokédex avec son nom français.
   * Effectue deux appels en parallèle : pokemon/{id} + pokemon-species/{id}.
   * @param id Numéro du Pokédex
   */
  getById(id: number): Observable<Pokemon> {
    return forkJoin({
      raw: this.repo.getById(id),
      species: this.repo.getSpecies(id),
    }).pipe(
      map(({raw, species}) => PokemonMapper.toModel(raw, extractFrenchName(species)))
    );
  }

  /**
   * Récupère un Pokémon avec ses attaques filtrées et triées, son nom français et sa description.
   * Effectue les appels pokemon/{id}, pokemon-species/{id} et tous les moves en parallèle.
   * @param id Numéro du Pokédex
   */
  getByIdWithMoves(id: number): Observable<{ pokemon: Pokemon; moves: Move[]; description: string }> {
    return forkJoin({
      raw: this.repo.getById(id),
      species: this.repo.getSpecies(id),
    }).pipe(
      switchMap(({raw, species}: {raw: RawPokemonDTO; species: any}) =>
        this.moveService.loadMovesFromDtos(raw.moves).pipe(
          map(moves => ({
            pokemon: PokemonMapper.toModel(raw, extractFrenchName(species)),
            moves,
            description: extractFrenchDescription(species),
          }))
        )
      )
    );
  }

  /**
   * Récupère un lot de Pokémon par plage d'identifiants (utilisé pour la pagination du store).
   * Les IDs dépassant 150 sont ignorés.
   * @param offset Index de départ (0-based)
   * @param limit Nombre de Pokémon à récupérer
   */
  getRange(offset: number, limit: number): Observable<Pokemon[]> {
    const ids = Array.from({ length: limit }, (_, i) => offset + i + 1)
      .filter(id => id <= 150);
    return forkJoin(ids.map(id => this.getById(id)));
  }

}
