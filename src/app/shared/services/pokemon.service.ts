import {PokemonRepository} from '../repositories/pokeApi.repository';
import {Pokemon} from '../models/pokemon.model';
import {forkJoin, map, Observable, switchMap} from 'rxjs';
import {Injectable} from '@angular/core';
import {PokemonMapper} from '../mappers/pokemon.mapper';
import {Move} from '../models/move.model';
import {MoveService} from './move.service';
import {RawPokemonDTO} from '../models/dto/pokemon.dto';

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
   * Récupère les premiers Pokémon (par défaut 150) en parallèle via leurs URLs.
   * @param amount Nombre de Pokémon à charger (défaut : 150)
   */
  getFirst150(amount : number = 150): Observable<Pokemon[]> {
    return this.repo.getList(amount).pipe(
      switchMap(list =>
        forkJoin(list.results.map(item => this.repo.getByUrl(item.url)))
      ),
      map(raws => raws.map(PokemonMapper.toModel))
    );
  }

  /**
   * Récupère un Pokémon par son numéro de Pokédex.
   * @param id Numéro du Pokédex
   */
  getById(id: number): Observable<Pokemon> {
    return this.repo.getById(id).pipe(
      map(PokemonMapper.toModel)
    );
  }

  /**
   * Récupère un Pokémon avec ses attaques filtrées et triées.
   * Les attaques sont chargées en parallèle via `MoveService.loadMovesFromDtos`
   * (filtre : power > 30, classe physique ou spéciale ; tri alphabétique par type).
   * @param id Numéro du Pokédex
   */
  getByIdWithMoves(id: number): Observable<{ pokemon: Pokemon; moves: Move[] }> {
    return this.repo.getById(id).pipe(
      switchMap((raw: RawPokemonDTO) =>
        this.moveService.loadMovesFromDtos(raw.moves).pipe(
          map(moves => ({
            pokemon: PokemonMapper.toModel(raw),
            moves,
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

  /**
   * Récupère la description anglaise d'un Pokémon depuis l'endpoint `pokemon-species`.
   * Nettoie les caractères parasites (form-feed `\f`, espaces multiples).
   * @param id Numéro du Pokédex
   * @returns Texte de description ou chaîne vide si non disponible
   */
  getDescription(id: number): Observable<string> {
    return this.repo.getSpecies(id).pipe(
      map((species: any) => {
        if (!species || !Array.isArray(species.flavor_text_entries)) return '';
        // find first english flavor_text
        const entry = species.flavor_text_entries.find((e: any) => e.language?.name === 'en');
        if (!entry || !entry.flavor_text) return '';
        // normalize whitespace and remove form-feed characters \f
        let txt = entry.flavor_text as string;
        txt = txt.replace(/\f/g, ' ');
        txt = txt.replace(/\s+/g, ' ').trim();
        return txt;
      })
    );
  }
}
