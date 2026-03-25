import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, forkJoin, map} from 'rxjs';
import {RawMoveDTO} from '../models/dto/pokemon.dto';
import {Move} from '../models/move.model';

/**
 * Service dédié au chargement et au mapping des capacités (moves) à partir des URLs
 * fournies par l'API Pokémon.
 */
@Injectable({ providedIn: 'root' })
export class MoveService {
  constructor(private readonly http: HttpClient) {}

  /**
   * Prend la liste des moves bruts d'un Pokémon (avec leurs URLs), appelle chaque URL,
   * et renvoie un tableau de Move détaillés.
   */
  loadMovesFromDtos(rawMoves: RawMoveDTO[]): Observable<Move[]> {
    if (!rawMoves || rawMoves.length === 0) {
      return new Observable<Move[]>(subscriber => {
        subscriber.next([]);
        subscriber.complete();
      });
    }

    const requests = rawMoves.map(raw => this.http.get<any>(raw.move.url).pipe(
      map(moveDto => ({
        name: moveDto.name,
        type: moveDto.type?.name ?? 'normal',
        power: moveDto.power ?? null,
        accuracy: moveDto.accuracy ?? null,
        damageClass: moveDto.damage_class?.name ?? 'physical',
      } as Move))
    ));

    return forkJoin(requests);
  }
}

