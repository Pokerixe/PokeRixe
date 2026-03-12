import { inject, Injectable, signal } from '@angular/core';
import { Pokemon } from '../../shared/models/pokemon.model';
import { PokemonService } from '../../shared/services/pokemon.service';

@Injectable({ providedIn: 'root' })
export class PokemonStore {
  private readonly pokemonService = inject(PokemonService);

  // État
  private readonly _pokemons = signal<Pokemon[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastFetch = signal<number | null>(null);

  // Exposé en lecture seule
  pokemons = this._pokemons.asReadonly();
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();

  // Cache de 5 minutes
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  private isCacheValid(): boolean {
    const last = this._lastFetch();
    return last !== null && (Date.now() - last) < this.CACHE_DURATION;
  }

  loadFirst150(): void {
    // ✅ Déjà en mémoire et cache valide → on ne refait pas l'appel
    if (this.isCacheValid()) return;

    this._loading.set(true);
    this._error.set(null);

    this.pokemonService.getFirst150().subscribe({
      next: (pokemons) => {
        this._pokemons.set(pokemons);
        this._lastFetch.set(Date.now());
        this._loading.set(false);
      },
      error: (err) => {
        this._error.set(err.message);
        this._loading.set(false);
      }
    });
  }

  // Accès rapide à un Pokémon par id sans refaire d'appel
  getById(id: number): Pokemon | undefined {
    return this._pokemons().find(p => p.id === id);
  }
}
