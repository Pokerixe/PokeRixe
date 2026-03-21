import { inject, Injectable, signal } from '@angular/core';
import { Pokemon } from '../../shared/models/pokemon.model';
import { PokemonService } from '../../shared/services/pokemon.service';

/** Store pour gérer l'état global des pokémons
 * Permet de centraliser la logique de chargement, de pagination, de cache, etc.
 * Les composants peuvent s'abonner aux signaux exposés par ce store pour réagir aux changements d'état
 * Exemple d'utilisation : dans un composant, injecter le store et s'abonner au signal pokemons pour afficher la liste des pokémons
 * Ce store gère le chargement des 150 premiers pokémons avec pagination, un cache de 5 minutes, et expose des signaux pour l'état de chargement et les erreurs
 */
@Injectable({ providedIn: 'root' })
export class PokemonStore {
  private readonly pokemonService = inject(PokemonService);

  private readonly _pokemons = signal<Pokemon[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastFetch = signal<number | null>(null);
  private readonly _currentOffset = signal(0);
  private readonly _hasMore = signal(true);

  pokemons = this._pokemons.asReadonly();

  private readonly CACHE_DURATION = 5 * 60 * 1000;
  private readonly BATCH_SIZE = 20;
  private readonly TOTAL = 150;

  private isCacheValid(): boolean {
    const last = this._lastFetch();
    return last !== null && (Date.now() - last) < this.CACHE_DURATION;
  }
  loading = this._loading.asReadonly();
  hasMore = this._hasMore.asReadonly();

  loadFirst150( nombre :number = 150): void {
    if (this._pokemons().length > 0 || this._loading()) return;
    this.loadNextBatch();
  }

  loadNextBatch(): void {
    const offset = this._currentOffset();
    if (this._loading() || !this._hasMore()) return;

    this._loading.set(true);
    this._error.set(null);

    this.pokemonService.getRange(offset, this.BATCH_SIZE).subscribe({
      next: (pokemons) => {
        this._pokemons.update(current => [...current, ...pokemons]);
        this._currentOffset.set(offset + this.BATCH_SIZE);
        this._hasMore.set(offset + this.BATCH_SIZE < this.TOTAL);
        this._loading.set(false);
      },
      error: (err) => {
        this._error.set(err.message);
        this._loading.set(false);
      }
    });
  }

  getById(id: number): Pokemon | undefined {
    return this._pokemons().find(p => p.id === id);
  }

  reset(): void {
    this._pokemons.set([]);
    this._currentOffset.set(0);
    this._hasMore.set(true);
    this._loading.set(false);
    this._error.set(null);
  }
}
