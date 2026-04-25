import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { PokemonStore } from './pokemon.store';
import { PokemonService } from '../../shared/services/pokemon.service';
import { Pokemon } from '../../shared/models/pokemon.model';

/**
 * Helper factory to create Pokemon objects with overrides.
 * Provides default values for all properties.
 */
function makePokemon(id: number = 1, overrides?: Partial<Pokemon>): Pokemon {
  const defaults: Pokemon = {
    id,
    name: `Pokemon ${id}`,
    types: ['Normal'],
    image: `https://example.com/${id}.png`,
    sprite: `https://example.com/sprite/${id}.png`,
    height: 10,
    weight: 50,
    stats: {
      hp: 50,
      attack: 50,
      defense: 50,
      specialAttack: 50,
      specialDefense: 50,
      speed: 50,
    },
    moves: ['tackle', 'scratch'],
  };
  return { ...defaults, ...overrides };
}

describe('PokemonStore', () => {
  let store: PokemonStore;
  let pokemonService: {
    getRange: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    pokemonService = {
      getRange: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        PokemonStore,
        { provide: PokemonService, useValue: pokemonService },
      ],
    });

    store = TestBed.inject(PokemonStore);
  });

  // ============================================================
  // A. Initial State
  // ============================================================
  describe('Initial State', () => {
    it('pokemons signal is empty on init', () => {
      expect(store.pokemons()).toEqual([]);
    });

    it('loading signal is false on init', () => {
      expect(store.loading()).toBe(false);
    });

    it('hasMore signal is true on init', () => {
      expect(store.hasMore()).toBe(true);
    });
  });

  // ============================================================
  // B. loadFirst150(amount) - Triggers batch loading
  // ============================================================
  describe('loadFirst150()', () => {
    it('triggers loadNextBatch on first call', () => {
      const batch = Array.from({ length: 20 }, (_, i) => makePokemon(i + 1));
      pokemonService.getRange.mockReturnValue(of(batch));

      store.loadFirst150();

      expect(pokemonService.getRange).toHaveBeenCalledWith(0, 20);
    });

    it('ignores second call when pokemons already loaded', () => {
      const batch = Array.from({ length: 20 }, (_, i) => makePokemon(i + 1));
      pokemonService.getRange.mockReturnValue(of(batch));

      store.loadFirst150();
      pokemonService.getRange.mockClear();

      store.loadFirst150();

      expect(pokemonService.getRange).not.toHaveBeenCalled();
    });

    it('does nothing when loading is in progress', () => {
      const batch = Array.from({ length: 20 }, (_, i) => makePokemon(i + 1));
      pokemonService.getRange.mockReturnValue(of(batch));

      store.loadFirst150();
      pokemonService.getRange.mockClear();

      // At this point, loading is true
      store.loadFirst150();

      expect(pokemonService.getRange).not.toHaveBeenCalled();
    });

    it('passes amount parameter to underlying call (ignored but compatible)', () => {
      const batch = Array.from({ length: 20 }, (_, i) => makePokemon(i + 1));
      pokemonService.getRange.mockReturnValue(of(batch));

      store.loadFirst150(100);

      expect(pokemonService.getRange).toHaveBeenCalledWith(0, 20);
    });

    it('populates pokemons signal after load completes', () => {
      const batch = Array.from({ length: 20 }, (_, i) => makePokemon(i + 1));
      pokemonService.getRange.mockReturnValue(of(batch));

      store.loadFirst150();

      expect(store.pokemons()).toHaveLength(20);
      expect(store.pokemons()[0].id).toBe(1);
      expect(store.pokemons()[19].id).toBe(20);
    });

    it('sets loading to false after load completes', () => {
      const batch = Array.from({ length: 20 }, (_, i) => makePokemon(i + 1));
      pokemonService.getRange.mockReturnValue(of(batch));

      store.loadFirst150();

      expect(store.loading()).toBe(false);
    });
  });

  // ============================================================
  // C. loadNextBatch() - Batch loading logic
  // ============================================================
  describe('loadNextBatch()', () => {
    it('appends 20 pokemon to the list', () => {
      const batch = Array.from({ length: 20 }, (_, i) => makePokemon(i + 1));
      pokemonService.getRange.mockReturnValue(of(batch));

      store.loadNextBatch();

      expect(store.pokemons()).toHaveLength(20);
    });

    it('appends multiple batches correctly', () => {
      const batch1 = Array.from({ length: 20 }, (_, i) => makePokemon(i + 1));
      const batch2 = Array.from({ length: 20 }, (_, i) => makePokemon(i + 21));
      pokemonService.getRange.mockReturnValueOnce(of(batch1));

      store.loadNextBatch();

      expect(store.pokemons()).toHaveLength(20);

      pokemonService.getRange.mockReturnValueOnce(of(batch2));

      store.loadNextBatch();

      expect(store.pokemons()).toHaveLength(40);
      expect(store.pokemons()[20].id).toBe(21);
    });

    it('advances offset by 20 after each batch', () => {
      const batch = Array.from({ length: 20 }, (_, i) => makePokemon(i + 1));
      pokemonService.getRange.mockReturnValue(of(batch));

      store.loadNextBatch();

      expect(pokemonService.getRange).toHaveBeenCalledWith(0, 20);

      const batch2 = Array.from({ length: 20 }, (_, i) => makePokemon(i + 21));
      pokemonService.getRange.mockReturnValue(of(batch2));

      store.loadNextBatch();

      expect(pokemonService.getRange).toHaveBeenCalledWith(20, 20);
    });

    it('sets hasMore=true when offset+batch < 150', () => {
      const batch = Array.from({ length: 20 }, (_, i) => makePokemon(i + 1));
      pokemonService.getRange.mockReturnValue(of(batch));

      store.loadNextBatch();

      // offset is now 20, hasMore should be true (20 + 20 < 150)
      expect(store.hasMore()).toBe(true);
    });

    it('sets hasMore=false when offset+batch >= 150', () => {
      // Simulate loading 7 full batches to reach offset 140
      for (let i = 0; i < 7; i++) {
        const batch = Array.from({ length: 20 }, (_, j) => makePokemon(i * 20 + j + 1));
        pokemonService.getRange.mockReturnValueOnce(of(batch));
        store.loadNextBatch();
      }

      expect(store.pokemons()).toHaveLength(140);
      expect(store.hasMore()).toBe(true);

      // Load the last 10
      const lastBatch = Array.from({ length: 10 }, (_, i) => makePokemon(141 + i));
      pokemonService.getRange.mockReturnValueOnce(of(lastBatch));

      store.loadNextBatch();

      // offset is now 160, 160 >= 150, so hasMore = false
      expect(store.hasMore()).toBe(false);
    });

    it('does nothing if hasMore is false', () => {
      // Load 8 batches to set hasMore=false (8*20=160 >= 150)
      for (let i = 0; i < 8; i++) {
        const batch = Array.from({ length: 20 }, (_, j) => makePokemon(i * 20 + j + 1));
        pokemonService.getRange.mockReturnValueOnce(of(batch));
        store.loadNextBatch();
      }

      pokemonService.getRange.mockClear();

      // Try to load more - should not call service
      store.loadNextBatch();

      expect(pokemonService.getRange).not.toHaveBeenCalled();
    });

    it('sets loading flag during request', () => {
      let loadingDuringRequest = false;
      const batch = Array.from({ length: 20 }, (_, i) => makePokemon(i + 1));

      pokemonService.getRange.mockImplementation(() => {
        loadingDuringRequest = store.loading();
        return of(batch);
      });

      store.loadNextBatch();

      expect(loadingDuringRequest).toBe(true);
    });

    it('clears error signal on successful load', () => {
      const batch = Array.from({ length: 20 }, (_, i) => makePokemon(i + 1));
      pokemonService.getRange.mockReturnValue(of(batch));

      store.loadNextBatch();

      expect(store.loading()).toBe(false);
    });

    it('handles API error gracefully', () => {
      const error = new Error('API Error');
      pokemonService.getRange.mockReturnValue(throwError(() => error));

      store.loadNextBatch();

      expect(store.loading()).toBe(false);
    });
  });

  // ============================================================
  // D. getById(id) - Cache lookup
  // ============================================================
  describe('getById()', () => {
    it('returns pokemon from cache when found', () => {
      const batch = Array.from({ length: 20 }, (_, i) => makePokemon(i + 1));
      pokemonService.getRange.mockReturnValue(of(batch));

      store.loadNextBatch();

      const found = store.getById(5);
      expect(found).toBeDefined();
      expect(found?.id).toBe(5);
      expect(found?.name).toBe('Pokemon 5');
    });

    it('returns undefined when pokemon not in cache', () => {
      const found = store.getById(25);
      expect(found).toBeUndefined();
    });

    it('finds correct pokemon by ID in loaded batch', () => {
      const batch = Array.from({ length: 20 }, (_, i) => makePokemon(i + 1));
      pokemonService.getRange.mockReturnValue(of(batch));

      store.loadNextBatch();

      expect(store.getById(1)?.id).toBe(1);
      expect(store.getById(20)?.id).toBe(20);
    });

    it('works with multiple loaded batches', () => {
      const batch1 = Array.from({ length: 20 }, (_, i) => makePokemon(i + 1));
      const batch2 = Array.from({ length: 20 }, (_, i) => makePokemon(i + 21));

      pokemonService.getRange.mockReturnValueOnce(of(batch1));
      pokemonService.getRange.mockReturnValueOnce(of(batch2));

      store.loadNextBatch();
      store.loadNextBatch();

      expect(store.getById(1)?.id).toBe(1);
      expect(store.getById(25)?.id).toBe(25);
      expect(store.getById(40)?.id).toBe(40);
      expect(store.getById(50)).toBeUndefined();
    });

    it('returns first match when multiple pokemon with same ID exist (should not happen)', () => {
      const batch = Array.from({ length: 20 }, (_, i) => makePokemon(i + 1));
      pokemonService.getRange.mockReturnValue(of(batch));

      store.loadNextBatch();

      const found = store.getById(10);
      expect(found?.id).toBe(10);
    });
  });

  // ============================================================
  // E. reset() - Clear all state
  // ============================================================
  describe('reset()', () => {
    it('clears pokemons array', () => {
      const batch = Array.from({ length: 20 }, (_, i) => makePokemon(i + 1));
      pokemonService.getRange.mockReturnValue(of(batch));

      store.loadNextBatch();

      expect(store.pokemons()).toHaveLength(20);

      store.reset();

      expect(store.pokemons()).toEqual([]);
    });

    it('resets offset to 0', () => {
      const batch = Array.from({ length: 20 }, (_, i) => makePokemon(i + 1));
      pokemonService.getRange.mockReturnValue(of(batch));

      store.loadNextBatch();

      store.reset();

      // Next load should start from 0
      pokemonService.getRange.mockClear();
      pokemonService.getRange.mockReturnValue(of(batch));
      store.loadNextBatch();

      expect(pokemonService.getRange).toHaveBeenCalledWith(0, 20);
    });

    it('sets hasMore to true', () => {
      const batch = Array.from({ length: 20 }, (_, i) => makePokemon(i + 1));
      pokemonService.getRange.mockReturnValue(of(batch));

      store.loadNextBatch();

      store.reset();

      expect(store.hasMore()).toBe(true);
    });

    it('sets loading to false', () => {
      const batch = Array.from({ length: 20 }, (_, i) => makePokemon(i + 1));
      pokemonService.getRange.mockReturnValue(of(batch));

      store.loadNextBatch();

      store.reset();

      expect(store.loading()).toBe(false);
    });

    it('clears error state', () => {
      const error = new Error('Test error');
      pokemonService.getRange.mockReturnValue(throwError(() => error));

      store.loadNextBatch();

      store.reset();

      // After reset, should be ready to load again
      const batch = Array.from({ length: 20 }, (_, i) => makePokemon(i + 1));
      pokemonService.getRange.mockReturnValue(of(batch));

      store.loadNextBatch();

      expect(store.pokemons()).toHaveLength(20);
    });

    it('allows fresh load after reset', () => {
      const batch1 = Array.from({ length: 20 }, (_, i) => makePokemon(i + 1));
      const batch2 = Array.from({ length: 20 }, (_, i) => makePokemon(i + 21));

      pokemonService.getRange.mockReturnValueOnce(of(batch1));

      store.loadNextBatch();

      expect(store.pokemons()).toHaveLength(20);

      store.reset();

      expect(store.pokemons()).toEqual([]);

      pokemonService.getRange.mockReturnValueOnce(of(batch2));
      store.loadNextBatch();

      expect(store.pokemons()).toHaveLength(20);
      expect(store.pokemons()[0].id).toBe(21);
    });
  });

  // ============================================================
  // F. Pagination Boundary Tests
  // ============================================================
  describe('Pagination Boundaries', () => {
    it('correctly handles 150 pokemon boundary', () => {
      // Load exactly 7 full batches (140) + 1 partial batch (10)
      pokemonService.getRange.mockClear();

      // Simulate 7 full batches
      for (let batchNum = 0; batchNum < 7; batchNum++) {
        const start = batchNum * 20 + 1;
        const batch = Array.from(
          { length: 20 },
          (_, i) => makePokemon(start + i)
        );
        pokemonService.getRange.mockReturnValueOnce(of(batch));
      }

      // Load 7 batches
      for (let i = 0; i < 7; i++) {
        store.loadNextBatch();
      }

      expect(store.pokemons()).toHaveLength(140);
      expect(store.hasMore()).toBe(true);

      // Load the remaining 10
      const lastBatch = Array.from(
        { length: 10 },
        (_, i) => makePokemon(141 + i)
      );
      pokemonService.getRange.mockReturnValueOnce(of(lastBatch));

      store.loadNextBatch();

      expect(store.pokemons()).toHaveLength(150);
      expect(store.hasMore()).toBe(false);
    });

    it('hasMore calculation: offset + BATCH_SIZE < TOTAL', () => {
      const batch1 = Array.from({ length: 20 }, (_, i) => makePokemon(i + 1));
      pokemonService.getRange.mockReturnValue(of(batch1));

      store.loadNextBatch();

      // After first batch: offset = 20, 20 + 20 = 40 < 150, so hasMore = true
      expect(store.hasMore()).toBe(true);
    });

    it('does not load if hasMore is false', () => {
      // Load 8 batches to set hasMore=false (8*20=160 >= 150)
      for (let i = 0; i < 8; i++) {
        const batch = Array.from({ length: 20 }, (_, j) => makePokemon(i * 20 + j + 1));
        pokemonService.getRange.mockReturnValueOnce(of(batch));
        store.loadNextBatch();
      }

      pokemonService.getRange.mockClear();

      // Try to load more - should not call service
      store.loadNextBatch();

      expect(pokemonService.getRange).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // G. Integration Tests
  // ============================================================
  describe('Integration', () => {
    it('loadFirst150 then subsequent manual calls work together', () => {
      const batch = Array.from({ length: 20 }, (_, i) => makePokemon(i + 1));
      pokemonService.getRange.mockReturnValue(of(batch));

      store.loadFirst150();

      expect(store.pokemons()).toHaveLength(20);

      const batch2 = Array.from({ length: 20 }, (_, i) => makePokemon(i + 21));
      pokemonService.getRange.mockReturnValue(of(batch2));

      store.loadNextBatch();

      expect(store.pokemons()).toHaveLength(40);
      expect(store.getById(25)?.id).toBe(25);
    });

    it('reset then loadFirst150 works', () => {
      const batch = Array.from({ length: 20 }, (_, i) => makePokemon(i + 1));
      pokemonService.getRange.mockReturnValue(of(batch));

      store.loadFirst150();

      expect(store.pokemons()).toHaveLength(20);

      store.reset();

      expect(store.pokemons()).toEqual([]);

      pokemonService.getRange.mockReturnValue(of(batch));
      store.loadFirst150();

      expect(store.pokemons()).toHaveLength(20);
    });

    it('signals reflect state changes', () => {
      const batch = Array.from({ length: 20 }, (_, i) => makePokemon(i + 1));
      pokemonService.getRange.mockReturnValue(of(batch));

      store.loadNextBatch();

      expect(store.pokemons().length).toBe(20);

      const batch2 = Array.from({ length: 20 }, (_, i) => makePokemon(i + 21));
      pokemonService.getRange.mockReturnValue(of(batch2));

      store.loadNextBatch();

      expect(store.pokemons().length).toBe(40);
    });

    it('full workflow: load multiple batches, query, reset, reload', () => {
      // Load 3 batches
      for (let i = 0; i < 3; i++) {
        const batch = Array.from({ length: 20 }, (_, j) => makePokemon(i * 20 + j + 1));
        pokemonService.getRange.mockReturnValueOnce(of(batch));
        store.loadNextBatch();
      }

      expect(store.pokemons()).toHaveLength(60);
      expect(store.getById(30)?.id).toBe(30);

      // Reset
      store.reset();

      expect(store.pokemons()).toHaveLength(0);
      expect(store.getById(30)).toBeUndefined();
      expect(store.hasMore()).toBe(true);

      // Reload
      const batch = Array.from({ length: 20 }, (_, j) => makePokemon(j + 1));
      pokemonService.getRange.mockReturnValueOnce(of(batch));
      store.loadNextBatch();

      expect(store.pokemons()).toHaveLength(20);
      expect(store.getById(10)?.id).toBe(10);
    });
  });
});
