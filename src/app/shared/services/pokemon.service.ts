import {PokemonRepository} from '../repositories/pokeApi.repository';
import {Pokemon} from '../models/pokemon.model';
import {forkJoin, map, Observable, switchMap} from 'rxjs';
import {Injectable} from '@angular/core';
import {PokemonMapper} from '../mappers/pokemon.mapper';
import {Move} from '../models/move.model';
import {MoveService} from './move.service';
import {RawPokemonDTO} from '../models/dto/pokemon.dto';

@Injectable({ providedIn: 'root' })
export class PokemonService {
  constructor(
    private readonly repo: PokemonRepository,
    private readonly moveService: MoveService,
  ) {}

  getFirst150(amount : number = 150): Observable<Pokemon[]> {
    return this.repo.getList(amount).pipe(
      switchMap(list =>
        forkJoin(list.results.map(item => this.repo.getByUrl(item.url)))
      ),
      map(raws => raws.map(PokemonMapper.toModel))
    );
  }

  getById(id: number): Observable<Pokemon> {
    return this.repo.getById(id).pipe(
      map(PokemonMapper.toModel)
    );
  }

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

  getRange(offset: number, limit: number): Observable<Pokemon[]> {
    // Exemple si tu charges par IDs (1 à 150)
    const ids = Array.from({ length: limit }, (_, i) => offset + i + 1)
      .filter(id => id <= 150);
    return forkJoin(ids.map(id => this.getById(id)));

    // Ou si ton API supporte offset/limit :
    // return this.http.get<Pokemon[]>(`${this.apiUrl}?offset=${offset}&limit=${limit}`);
  }



}
