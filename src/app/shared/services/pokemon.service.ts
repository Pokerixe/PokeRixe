import {PokemonRepository} from '../repositories/pokeApi.repository';
import {Pokemon} from '../models/pokemon.model';
import {forkJoin, map, Observable, switchMap} from 'rxjs';
import {Injectable} from '@angular/core';
import {PokemonMapper} from '../mappers/pokemon.mapper';

@Injectable({ providedIn: 'root' })
export class PokemonService {
  constructor(private repo: PokemonRepository) {}

  getFirst150(amount : number = 150): Observable<Pokemon[]> {
    return this.repo.getList(amount).pipe(
      switchMap(list =>
        forkJoin(list.results.map(item => this.repo.getByUrl(item.url)))
      ),
      map(raws => raws.map(PokemonMapper.toModel))
    );
  }
}
