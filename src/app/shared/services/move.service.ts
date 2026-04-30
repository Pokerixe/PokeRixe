import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, forkJoin, map, of, catchError} from 'rxjs';
import {RawMoveDTO} from '../models/dto/pokemon.dto';
import {Move} from '../models/move.model';

/**
 * Service dédié au chargement et au mapping des capacités (moves) à partir des URLs
 * fournies par l'API Pokémon.
 */
@Injectable({ providedIn: 'root' })
export class MoveService {
  private readonly BASE = 'https://pokeapi.co/api/v2';
  private readonly frenchNameCache = new Map<string, string>();

  constructor(private readonly http: HttpClient) {}

  /**
   * Retourne le nom français d'une attaque depuis son slug PokeAPI.
   * Le slug est normalisé (minuscules + espaces → tirets) avant l'appel.
   * Le résultat est mis en cache pour éviter les appels redondants.
   * @param slug Nom anglais de l'attaque (ex: "flamethrower", "Fire Blast")
   */
  getFrenchName(slug: string): Observable<string> {
    const normalized = slug.toLowerCase().replace(/\s+/g, '-');
    if (this.frenchNameCache.has(normalized)) {
      return of(this.frenchNameCache.get(normalized)!);
    }
    return this.http.get<any>(`${this.BASE}/move/${normalized}`).pipe(
      map(dto => {
        const entry = (dto.names as any[])?.find((n: any) => n.language?.name === 'fr');
        const frenchName = entry?.name ?? slug;
        this.frenchNameCache.set(normalized, frenchName);
        return frenchName;
      }),
      catchError(() => of(slug))
    );
  }

  /**
   * Prend la liste des moves bruts d'un Pokémon (avec leurs URLs), appelle chaque URL,
   * et renvoie un tableau de Move détaillés.
   *
   * NOTE: On applique ici le filtrage et le tri global demandé :
   * - ne garder que les moves avec damageClass 'physical' ou 'special'
   * - et power > 30 (les moves sans power sont exclus)
   * - trier par `type` alphabétiquement (insensible à la casse)
   */
  loadMovesFromDtos(rawMoves: RawMoveDTO[]): Observable<Move[]> {
    if (!rawMoves || rawMoves.length === 0) {
      return new Observable<Move[]>(subscriber => {
        subscriber.next([]);
        subscriber.complete();
      });
    }

    const requests = rawMoves.map(raw => this.http.get<any>(raw.move.url).pipe(
      map(moveDto => {
        const frenchNameEntry = (moveDto.names as any[])?.find((n: any) => n.language?.name === 'fr');
        return {
          id : moveDto.id,
          name: moveDto.name,
          frenchName: frenchNameEntry?.name ?? moveDto.name,
          type: moveDto.type?.name ?? 'normal',
          power: moveDto.power ?? null,
          accuracy: moveDto.accuracy ?? null,
          damageClass: moveDto.damage_class?.name ?? 'physical',
        } as Move;
      })
    ));

    return forkJoin(requests).pipe(
      map((moves: Move[]) => {
        // Filtrer : power != null && power > 30 && damageClass in (physical, special)
        const filtered = (moves || []).filter(m => {
          const dmg = (m.damageClass || '').toLowerCase();
          return m.power !== null && m.power > 30 && (dmg === 'physical' || dmg === 'special');
        });
        // Trier par type alphabétiquement (insensible à la casse)
        filtered.sort((a, b) => (a.type || '').toLowerCase().localeCompare((b.type || '').toLowerCase()));
        return filtered;
      })
    );
  }

  /**
   * Filtre un tableau de `Move` selon des critères simples.
   * Exemples d'utilisation :
   *   const filtered = this.moveService.filterMoves(moves, { minPower: 50, damageClass: 'physical' });
   *
   * Critères supportés :
   * - minPower (number) : inclut les moves dont power >= minPower (ignore si power est null)
   * - maxPower (number) : inclut les moves dont power <= maxPower
   * - damageClass (string) : correspondance insensible à la casse sur damageClass
   * - type (string) : correspondance insensible à la casse sur type
   * - minAccuracy (number) : inclut les moves dont accuracy >= minAccuracy
   */
  filterMoves(moves: Move[], criteria?: {
    minPower?: number;
    maxPower?: number;
    damageClass?: string;
    type?: string;
    minAccuracy?: number;
  }): Move[] {
    if (!moves || moves.length === 0) return [];
    if (!criteria) return moves.slice();

    const {
      minPower,
      maxPower,
      damageClass,
      type,
      minAccuracy,
    } = criteria;

    return moves.filter(m => {
      // power can be null in the data model
      if (typeof minPower === 'number') {
        if (m.power === null || m.power < minPower) return false;
      }
      if (typeof maxPower === 'number') {
        if (m.power === null || m.power > maxPower) return false;
      }

      if (typeof minAccuracy === 'number') {
        if (m.accuracy === null || m.accuracy < minAccuracy) return false;
      }

      if (damageClass) {
        if (!m.damageClass) return false;
        if (m.damageClass.toLowerCase() !== damageClass.toLowerCase()) return false;
      }

      if (type) {
        if (!m.type) return false;
        if (m.type.toLowerCase() !== type.toLowerCase()) return false;
      }

      return true;
    });
  }
}
