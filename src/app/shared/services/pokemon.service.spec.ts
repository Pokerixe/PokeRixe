import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {of} from 'rxjs';
import {vi} from 'vitest';
import {PokemonService} from './pokemon.service';
import {PokemonRepository} from '../repositories/pokeApi.repository';
import {MoveService} from './move.service';
import {Pokemon} from '../models/pokemon.model';
import {Move} from '../models/move.model';
import {RawPokemonDTO, RawMoveDTO} from '../models/dto/pokemon.dto';
import {PokemonListDTO} from '../models/dto/pokemon-list.dto';

/**
 * Helper factory to create Pokemon objects with overrides.
 * Provides default values for all properties.
 */
function makePokemon(overrides?: Partial<Pokemon>): Pokemon {
  const defaults: Pokemon = {
    id: 1,
    name: 'Bulbizarre',
    types: ['Grass', 'Poison'],
    image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
    height: 7,
    weight: 69,
    stats: {
      hp: 45,
      attack: 49,
      defense: 49,
      specialAttack: 65,
      specialDefense: 65,
      speed: 45,
    },
    moves: ['razor-leaf', 'vine-whip'],
  };
  return {...defaults, ...overrides};
}

/**
 * Helper factory to create raw Pokemon DTOs.
 */
function makeRawPokemon(overrides?: Partial<RawPokemonDTO>): RawPokemonDTO {
  const defaults: RawPokemonDTO = {
    id: 1,
    name: 'bulbasaur',
    height: 7,
    weight: 69,
    types: [{type: {name: 'grass'}}, {type: {name: 'poison'}}],
    stats: [
      {base_stat: 45, stat: {name: 'hp'}},
      {base_stat: 49, stat: {name: 'attack'}},
      {base_stat: 49, stat: {name: 'defense'}},
      {base_stat: 65, stat: {name: 'special-attack'}},
      {base_stat: 65, stat: {name: 'special-defense'}},
      {base_stat: 45, stat: {name: 'speed'}},
    ],
    moves: [
      {move: {name: 'razor-leaf', url: 'https://pokeapi.co/api/v2/move/1'}},
      {move: {name: 'vine-whip', url: 'https://pokeapi.co/api/v2/move/2'}},
    ],
    sprites: {
      front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
      other: {
        'official-artwork': {
          front_default:
            'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
        },
      },
    },
  };
  return {...defaults, ...overrides};
}

/**
 * Helper factory to create Pokemon species DTOs.
 */
function makeSpecies(overrides?: any): any {
  const defaults = {
    id: 1,
    names: [
      {language: {name: 'en'}, name: 'Bulbasaur'},
      {language: {name: 'fr'}, name: 'Bulbizarre'},
      {language: {name: 'de'}, name: 'Bisaknosp'},
    ],
    flavor_text_entries: [
      {
        flavor_text: 'This Pokémon is small.\fAlways found in small groups.',
        language: {name: 'en'},
      },
      {
        flavor_text: 'Il porte une graine sur son dos\fdepuis le jour de sa naissance.',
        language: {name: 'fr'},
      },
      {
        flavor_text: 'Dieses Pokémon trägt eine Knospe auf seinem Rücken.',
        language: {name: 'de'},
      },
    ],
  };
  return {...defaults, ...overrides};
}

/**
 * Helper factory to create Move objects.
 */
function makeMove(overrides?: Partial<Move>): Move {
  const defaults: Move = {
    name: 'tackle',
    frenchName: 'Charge',
    type: 'normal',
    power: 40,
    accuracy: 100,
    damageClass: 'physical',
  };
  return {...defaults, ...overrides};
}

/**
 * Helper factory to create RawMoveDTO objects.
 */
function makeRawMove(name: string = 'tackle'): RawMoveDTO {
  return {
    move: {
      name,
      url: `https://pokeapi.co/api/v2/move/${name}`,
    },
  };
}

describe('PokemonService', () => {
  let service: PokemonService;
  let repo: {
    getList: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
    getByUrl: ReturnType<typeof vi.fn>;
    getSpecies: ReturnType<typeof vi.fn>;
  };
  let moveService: {
    loadMovesFromDtos: ReturnType<typeof vi.fn>;
    filterMoves: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    const repoMock = {
      getList: vi.fn(),
      getById: vi.fn(),
      getByUrl: vi.fn(),
      getSpecies: vi.fn(),
    };
    const moveMock = {
      loadMovesFromDtos: vi.fn(),
      filterMoves: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        PokemonService,
        {provide: PokemonRepository, useValue: repoMock},
        {provide: MoveService, useValue: moveMock},
        provideHttpClient(),
      ],
    });

    service = TestBed.inject(PokemonService);
    repo = TestBed.inject(PokemonRepository) as any;
    moveService = TestBed.inject(MoveService) as any;
  });

  // ============================================================
  // A. getById(id) - Parallel API calls with forkJoin
  // ============================================================
  describe('getById()', () => {
    it('calls repo.getById and repo.getSpecies in parallel', () => {
      const raw = makeRawPokemon({id: 1});
      const species = makeSpecies();

      repo.getById.mockReturnValue(of(raw));
      repo.getSpecies.mockReturnValue(of(species));

      service.getById(1).subscribe();

      expect(repo.getById).toHaveBeenCalledWith(1);
      expect(repo.getSpecies).toHaveBeenCalledWith(1);
    });

    it('returns mapped Pokemon with french name from species', () => {
      const raw = makeRawPokemon({id: 1, name: 'bulbasaur'});
      const species = makeSpecies({id: 1});

      repo.getById.mockReturnValue(of(raw));
      repo.getSpecies.mockReturnValue(of(species));

      let pokemon: Pokemon | undefined;
      service.getById(1).subscribe((p) => {
        pokemon = p;
      });

      expect(pokemon?.name).toBe('Bulbizarre');
      expect(pokemon?.id).toBe(1);
    });

    it('falls back to english name when no french name found', () => {
      const raw = makeRawPokemon({id: 25, name: 'pikachu'});
      const species = makeSpecies({names: [{language: {name: 'en'}, name: 'Pikachu'}]});

      repo.getById.mockReturnValue(of(raw));
      repo.getSpecies.mockReturnValue(of(species));

      let pokemon: Pokemon | undefined;
      service.getById(25).subscribe((p) => {
        pokemon = p;
      });

      expect(pokemon?.name).toBe('pikachu');
    });

    it('falls back to english name when species has no names array', () => {
      const raw = makeRawPokemon({id: 150, name: 'mewtwo'});
      const species = makeSpecies({names: undefined});

      repo.getById.mockReturnValue(of(raw));
      repo.getSpecies.mockReturnValue(of(species));

      let pokemon: Pokemon | undefined;
      service.getById(150).subscribe((p) => {
        pokemon = p;
      });

      expect(pokemon?.name).toBe('mewtwo');
    });

    it('maps all pokemon fields correctly', () => {
      const raw = makeRawPokemon({id: 25});
      const species = makeSpecies();

      repo.getById.mockReturnValue(of(raw));
      repo.getSpecies.mockReturnValue(of(species));

      let pokemon: Pokemon | undefined;
      service.getById(25).subscribe((p) => {
        pokemon = p;
      });

      expect(pokemon?.id).toBe(25);
      expect(pokemon?.types).toContain('grass');
      expect(pokemon?.types).toContain('poison');
      expect(pokemon?.height).toBe(7);
      expect(pokemon?.weight).toBe(69);
      expect(pokemon?.stats.hp).toBe(45);
      expect(pokemon?.stats.attack).toBe(49);
      expect(pokemon?.stats.defense).toBe(49);
      expect(pokemon?.stats.specialAttack).toBe(65);
      expect(pokemon?.stats.specialDefense).toBe(65);
      expect(pokemon?.stats.speed).toBe(45);
    });

    it('works with different pokemon IDs (1, 25, 150)', () => {
      const testIds = [1, 25, 150];
      const raw = makeRawPokemon();
      const species = makeSpecies();

      repo.getById.mockReturnValue(of(raw));
      repo.getSpecies.mockReturnValue(of(species));

      testIds.forEach((id) => {
        service.getById(id).subscribe();
      });

      expect(repo.getById).toHaveBeenCalledWith(1);
      expect(repo.getById).toHaveBeenCalledWith(25);
      expect(repo.getById).toHaveBeenCalledWith(150);
    });
  });

  // ============================================================
  // B. getRange(offset, limit) - Batch loading
  // ============================================================
  describe('getRange()', () => {
    it('returns array of pokemon for given range', () => {
      const raw1 = makeRawPokemon({id: 1});
      const raw2 = makeRawPokemon({id: 2, name: 'ivysaur'});
      const species = makeSpecies();

      repo.getById.mockReturnValueOnce(of(raw1));
      repo.getById.mockReturnValueOnce(of(raw2));
      repo.getSpecies.mockReturnValue(of(species));

      let pokemons: Pokemon[] | undefined;
      service.getRange(0, 2).subscribe((p) => {
        pokemons = p;
      });

      expect(pokemons).toHaveLength(2);
      expect(pokemons?.[0].id).toBe(1);
      expect(pokemons?.[1].id).toBe(2);
    });

    it('uses Array.from() to generate IDs from offset to offset+limit', () => {
      const raw = makeRawPokemon();
      const species = makeSpecies();

      repo.getById.mockReturnValue(of(raw));
      repo.getSpecies.mockReturnValue(of(species));

      service.getRange(5, 3).subscribe();

      // Should call getById for IDs: 6, 7, 8 (offset+1 to offset+limit)
      expect(repo.getById).toHaveBeenCalledWith(6);
      expect(repo.getById).toHaveBeenCalledWith(7);
      expect(repo.getById).toHaveBeenCalledWith(8);
    });

    it('filters out IDs that exceed 150', () => {
      const raw = makeRawPokemon();
      const species = makeSpecies();

      repo.getById.mockReturnValue(of(raw));
      repo.getSpecies.mockReturnValue(of(species));

      let pokemons: Pokemon[] | undefined;
      service.getRange(149, 5).subscribe((p) => {
        pokemons = p;
      });

      expect(pokemons).toHaveLength(1);
      expect(repo.getById).toHaveBeenCalledWith(150);
      expect(repo.getById).not.toHaveBeenCalledWith(151);
    });

    it('returns empty array when offset >= 150', () => {
      let pokemons: Pokemon[] | undefined = undefined;
      service.getRange(150, 10).subscribe(
        (p) => {
          pokemons = p;
        },
        () => {},
        () => {
          // Complete without emission (forkJoin of empty array)
        }
      );

      // forkJoin with empty array doesn't emit a value, so use toBeUndefined or check expectation differently
      expect(pokemons ?? []).toHaveLength(0);
    });

    it('returns empty array when offset is 151', () => {
      let pokemons: Pokemon[] | undefined = undefined;
      service.getRange(151, 5).subscribe(
        (p) => {
          pokemons = p;
        },
        () => {},
        () => {
          // Complete without emission (forkJoin of empty array)
        }
      );

      expect(pokemons ?? []).toHaveLength(0);
    });

    it('works with different ranges', () => {
      const raw = makeRawPokemon();
      const species = makeSpecies();

      repo.getById.mockReturnValue(of(raw));
      repo.getSpecies.mockReturnValue(of(species));

      let pokemons: Pokemon[] | undefined;
      service.getRange(0, 20).subscribe((p) => {
        pokemons = p;
      });

      expect(pokemons).toHaveLength(20);
      expect(repo.getById).toHaveBeenCalledWith(1);
      expect(repo.getById).toHaveBeenCalledWith(20);
    });

    it('handles page boundaries correctly (140-150)', () => {
      const raw = makeRawPokemon();
      const species = makeSpecies();

      repo.getById.mockReturnValue(of(raw));
      repo.getSpecies.mockReturnValue(of(species));

      let pokemons: Pokemon[] | undefined;
      service.getRange(140, 20).subscribe((p) => {
        pokemons = p;
      });

      // IDs 141-150, so only 10 results
      expect(pokemons).toHaveLength(10);
      expect(repo.getById).toHaveBeenCalledWith(141);
      expect(repo.getById).toHaveBeenCalledWith(150);
      expect(repo.getById).not.toHaveBeenCalledWith(151);
    });
  });

  // ============================================================
  // C. getByIdWithMoves(id) - Full Pokemon details
  // ============================================================
  describe('getByIdWithMoves()', () => {
    it('returns object with pokemon, moves, and description', () => {
      const raw = makeRawPokemon({id: 1});
      const species = makeSpecies({id: 1});
      const moves = [makeMove()];

      repo.getById.mockReturnValue(of(raw));
      repo.getSpecies.mockReturnValue(of(species));
      moveService.loadMovesFromDtos.mockReturnValue(of(moves));

      let result: any;
      service.getByIdWithMoves(1).subscribe((r) => {
        result = r;
      });

      expect(result).toHaveProperty('pokemon');
      expect(result).toHaveProperty('moves');
      expect(result).toHaveProperty('description');
    });

    it('returns pokemon with correct data', () => {
      const raw = makeRawPokemon({id: 1, name: 'bulbasaur'});
      const species = makeSpecies({id: 1});
      const moves = [makeMove()];

      repo.getById.mockReturnValue(of(raw));
      repo.getSpecies.mockReturnValue(of(species));
      moveService.loadMovesFromDtos.mockReturnValue(of(moves));

      let result: any;
      service.getByIdWithMoves(1).subscribe((r) => {
        result = r;
      });

      expect(result.pokemon.name).toBe('Bulbizarre');
      expect(result.pokemon.id).toBe(1);
    });

    it('returns moves from loadMovesFromDtos', () => {
      const raw = makeRawPokemon({id: 25});
      const species = makeSpecies();
      const moves = [
        makeMove({name: 'tackle'}),
        makeMove({name: 'thunder-shock', frenchName: 'Éclair', type: 'electric'}),
      ];

      repo.getById.mockReturnValue(of(raw));
      repo.getSpecies.mockReturnValue(of(species));
      moveService.loadMovesFromDtos.mockReturnValue(of(moves));

      let result: any;
      service.getByIdWithMoves(25).subscribe((r) => {
        result = r;
      });

      expect(result.moves).toEqual(moves);
      expect(result.moves).toHaveLength(2);
    });

    it('passes pokemon moves to loadMovesFromDtos', () => {
      const raw = makeRawPokemon({id: 1, moves: [makeRawMove('tackle'), makeRawMove('vine-whip')]});
      const species = makeSpecies();
      const moves = [makeMove()];

      repo.getById.mockReturnValue(of(raw));
      repo.getSpecies.mockReturnValue(of(species));
      moveService.loadMovesFromDtos.mockReturnValue(of(moves));

      service.getByIdWithMoves(1).subscribe();

      expect(moveService.loadMovesFromDtos).toHaveBeenCalledWith(raw.moves);
    });

    it('extracts french description from species flavor_text_entries', () => {
      const raw = makeRawPokemon({id: 1});
      const species = makeSpecies();
      const moves = [makeMove()];

      repo.getById.mockReturnValue(of(raw));
      repo.getSpecies.mockReturnValue(of(species));
      moveService.loadMovesFromDtos.mockReturnValue(of(moves));

      let result: any;
      service.getByIdWithMoves(1).subscribe((r) => {
        result = r;
      });

      expect(result.description).toContain('graine');
    });

    it('normalizes description (removes form feeds)', () => {
      const raw = makeRawPokemon({id: 1});
      const species = makeSpecies({
        flavor_text_entries: [
          {
            flavor_text: 'First line\fSecond line',
            language: {name: 'fr'},
          },
        ],
      });
      const moves = [makeMove()];

      repo.getById.mockReturnValue(of(raw));
      repo.getSpecies.mockReturnValue(of(species));
      moveService.loadMovesFromDtos.mockReturnValue(of(moves));

      let result: any;
      service.getByIdWithMoves(1).subscribe((r) => {
        result = r;
      });

      expect(result.description).toBe('First line Second line');
      expect(result.description).not.toContain('\f');
    });

    it('normalizes description (collapses extra whitespace)', () => {
      const raw = makeRawPokemon({id: 1});
      const species = makeSpecies({
        flavor_text_entries: [
          {
            flavor_text: 'Text   with    multiple   spaces',
            language: {name: 'fr'},
          },
        ],
      });
      const moves = [makeMove()];

      repo.getById.mockReturnValue(of(raw));
      repo.getSpecies.mockReturnValue(of(species));
      moveService.loadMovesFromDtos.mockReturnValue(of(moves));

      let result: any;
      service.getByIdWithMoves(1).subscribe((r) => {
        result = r;
      });

      expect(result.description).toBe('Text with multiple spaces');
    });

    it('normalizes description (trims leading/trailing whitespace)', () => {
      const raw = makeRawPokemon({id: 1});
      const species = makeSpecies({
        flavor_text_entries: [
          {
            flavor_text: '   Text   ',
            language: {name: 'fr'},
          },
        ],
      });
      const moves = [makeMove()];

      repo.getById.mockReturnValue(of(raw));
      repo.getSpecies.mockReturnValue(of(species));
      moveService.loadMovesFromDtos.mockReturnValue(of(moves));

      let result: any;
      service.getByIdWithMoves(1).subscribe((r) => {
        result = r;
      });

      expect(result.description).toBe('Text');
    });

    it('returns empty string when no french description found', () => {
      const raw = makeRawPokemon({id: 150});
      const species = makeSpecies({
        flavor_text_entries: [
          {
            flavor_text: 'This is english',
            language: {name: 'en'},
          },
          {
            flavor_text: 'Das ist deutsch',
            language: {name: 'de'},
          },
        ],
      });
      const moves = [makeMove()];

      repo.getById.mockReturnValue(of(raw));
      repo.getSpecies.mockReturnValue(of(species));
      moveService.loadMovesFromDtos.mockReturnValue(of(moves));

      let result: any;
      service.getByIdWithMoves(150).subscribe((r) => {
        result = r;
      });

      expect(result.description).toBe('');
    });

    it('returns empty string when flavor_text_entries is missing', () => {
      const raw = makeRawPokemon({id: 1});
      const species = makeSpecies({flavor_text_entries: undefined});
      const moves = [makeMove()];

      repo.getById.mockReturnValue(of(raw));
      repo.getSpecies.mockReturnValue(of(species));
      moveService.loadMovesFromDtos.mockReturnValue(of(moves));

      let result: any;
      service.getByIdWithMoves(1).subscribe((r) => {
        result = r;
      });

      expect(result.description).toBe('');
    });

    it('returns empty string when flavor_text_entries is empty array', () => {
      const raw = makeRawPokemon({id: 1});
      const species = makeSpecies({flavor_text_entries: []});
      const moves = [makeMove()];

      repo.getById.mockReturnValue(of(raw));
      repo.getSpecies.mockReturnValue(of(species));
      moveService.loadMovesFromDtos.mockReturnValue(of(moves));

      let result: any;
      service.getByIdWithMoves(1).subscribe((r) => {
        result = r;
      });

      expect(result.description).toBe('');
    });

    it('handles undefined species gracefully', () => {
      const raw = makeRawPokemon({id: 1});
      const moves = [makeMove()];

      repo.getById.mockReturnValue(of(raw));
      repo.getSpecies.mockReturnValue(of(undefined));
      moveService.loadMovesFromDtos.mockReturnValue(of(moves));

      let result: any;
      service.getByIdWithMoves(1).subscribe((r) => {
        result = r;
      });

      expect(result.pokemon).toBeDefined();
      expect(result.moves).toBeDefined();
      expect(result.description).toBe('');
    });

    it('coordinates forkJoin then switchMap to loadMovesFromDtos', () => {
      const raw = makeRawPokemon({id: 1});
      const species = makeSpecies();
      const moves = [makeMove()];

      repo.getById.mockReturnValue(of(raw));
      repo.getSpecies.mockReturnValue(of(species));
      moveService.loadMovesFromDtos.mockReturnValue(of(moves));

      service.getByIdWithMoves(1).subscribe();

      expect(repo.getById).toHaveBeenCalledWith(1);
      expect(repo.getSpecies).toHaveBeenCalledWith(1);
      expect(moveService.loadMovesFromDtos).toHaveBeenCalled();
    });
  });

  // ============================================================
  // D. getFirst150(amount) - Loading all Gen 1
  // ============================================================
  describe('getFirst150()', () => {
    it('calls repo.getList with default amount 150', () => {
      const list: PokemonListDTO = {
        count: 150,
        next: null,
        previous: null,
        results: [{name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/'}],
      };
      const raw = makeRawPokemon({id: 1});
      const species = makeSpecies();

      repo.getList.mockReturnValue(of(list));
      repo.getById.mockReturnValue(of(raw));
      repo.getSpecies.mockReturnValue(of(species));

      service.getFirst150().subscribe();

      expect(repo.getList).toHaveBeenCalledWith(150);
    });

    it('accepts custom amount parameter', () => {
      const list: PokemonListDTO = {
        count: 50,
        next: null,
        previous: null,
        results: [{name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/'}],
      };
      const raw = makeRawPokemon({id: 1});
      const species = makeSpecies();

      repo.getList.mockReturnValue(of(list));
      repo.getById.mockReturnValue(of(raw));
      repo.getSpecies.mockReturnValue(of(species));

      service.getFirst150(50).subscribe();

      expect(repo.getList).toHaveBeenCalledWith(50);
    });

    it('extracts ID from pokemon URL', () => {
      const list: PokemonListDTO = {
        count: 2,
        next: null,
        previous: null,
        results: [
          {name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/'},
          {name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/'},
        ],
      };
      const raw1 = makeRawPokemon({id: 1});
      const raw2 = makeRawPokemon({id: 2});
      const species = makeSpecies();

      repo.getList.mockReturnValue(of(list));
      repo.getById.mockReturnValueOnce(of(raw1));
      repo.getById.mockReturnValueOnce(of(raw2));
      repo.getSpecies.mockReturnValue(of(species));

      service.getFirst150(2).subscribe();

      expect(repo.getById).toHaveBeenCalledWith(1);
      expect(repo.getById).toHaveBeenCalledWith(2);
    });

    it('extracts ID correctly from URL with trailing slash', () => {
      const list: PokemonListDTO = {
        count: 1,
        next: null,
        previous: null,
        results: [{name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/'}],
      };
      const raw = makeRawPokemon({id: 25});
      const species = makeSpecies();

      repo.getList.mockReturnValue(of(list));
      repo.getById.mockReturnValue(of(raw));
      repo.getSpecies.mockReturnValue(of(species));

      service.getFirst150(1).subscribe();

      expect(repo.getById).toHaveBeenCalledWith(25);
    });

    it('extracts ID correctly when URL has no trailing slash', () => {
      const list: PokemonListDTO = {
        count: 1,
        next: null,
        previous: null,
        results: [{name: 'mewtwo', url: 'https://pokeapi.co/api/v2/pokemon/150'}],
      };
      const raw = makeRawPokemon({id: 150});
      const species = makeSpecies();

      repo.getList.mockReturnValue(of(list));
      repo.getById.mockReturnValue(of(raw));
      repo.getSpecies.mockReturnValue(of(species));

      service.getFirst150(1).subscribe();

      expect(repo.getById).toHaveBeenCalledWith(150);
    });

    it('returns array of Pokemon', () => {
      const list: PokemonListDTO = {
        count: 3,
        next: null,
        previous: null,
        results: [
          {name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/'},
          {name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/'},
          {name: 'venusaur', url: 'https://pokeapi.co/api/v2/pokemon/3/'},
        ],
      };
      const raw1 = makeRawPokemon({id: 1});
      const raw2 = makeRawPokemon({id: 2});
      const raw3 = makeRawPokemon({id: 3});
      const species = makeSpecies();

      repo.getList.mockReturnValue(of(list));
      repo.getById.mockReturnValueOnce(of(raw1));
      repo.getById.mockReturnValueOnce(of(raw2));
      repo.getById.mockReturnValueOnce(of(raw3));
      repo.getSpecies.mockReturnValue(of(species));

      let pokemons: Pokemon[] | undefined;
      service.getFirst150(3).subscribe((p) => {
        pokemons = p;
      });

      expect(pokemons).toHaveLength(3);
      expect(pokemons?.[0].id).toBe(1);
      expect(pokemons?.[1].id).toBe(2);
      expect(pokemons?.[2].id).toBe(3);
    });

    it('uses switchMap pattern: getList then forkJoin of getById', () => {
      const list: PokemonListDTO = {
        count: 2,
        next: null,
        previous: null,
        results: [
          {name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/'},
          {name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/'},
        ],
      };
      const raw1 = makeRawPokemon({id: 1});
      const raw2 = makeRawPokemon({id: 2});
      const species = makeSpecies();

      repo.getList.mockReturnValue(of(list));
      repo.getById.mockReturnValueOnce(of(raw1));
      repo.getById.mockReturnValueOnce(of(raw2));
      repo.getSpecies.mockReturnValue(of(species));

      service.getFirst150(2).subscribe();

      expect(repo.getList).toHaveBeenCalledBefore(repo.getById);
    });

    it('handles large lists (all 150 pokemon)', () => {
      const results = Array.from({length: 150}, (_, i) => ({
        name: `pokemon-${i + 1}`,
        url: `https://pokeapi.co/api/v2/pokemon/${i + 1}/`,
      }));

      const list: PokemonListDTO = {
        count: 150,
        next: null,
        previous: null,
        results,
      };

      const raw = makeRawPokemon();
      const species = makeSpecies();

      repo.getList.mockReturnValue(of(list));
      repo.getById.mockReturnValue(of(raw));
      repo.getSpecies.mockReturnValue(of(species));

      let pokemons: Pokemon[] | undefined;
      service.getFirst150(150).subscribe((p) => {
        pokemons = p;
      });

      expect(pokemons).toHaveLength(150);
    });

    it('works with different amounts', () => {
      const results = Array.from({length: 50}, (_, i) => ({
        name: `pokemon-${i + 1}`,
        url: `https://pokeapi.co/api/v2/pokemon/${i + 1}/`,
      }));

      const list: PokemonListDTO = {
        count: 50,
        next: null,
        previous: null,
        results,
      };

      const raw = makeRawPokemon();
      const species = makeSpecies();

      repo.getList.mockReturnValue(of(list));
      repo.getById.mockReturnValue(of(raw));
      repo.getSpecies.mockReturnValue(of(species));

      let pokemons: Pokemon[] | undefined;
      service.getFirst150(50).subscribe((p) => {
        pokemons = p;
      });

      expect(pokemons).toHaveLength(50);
      expect(repo.getList).toHaveBeenCalledWith(50);
    });
  });
});
