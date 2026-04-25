import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PokemonRepository } from './pokeApi.repository';
import { PokemonListDTO } from '../models/dto/pokemon-list.dto';
import { RawPokemonDTO } from '../models/dto/pokemon.dto';

describe('PokemonRepository', () => {
  let repository: PokemonRepository;
  let httpMock: HttpTestingController;

  const mockPokemonListDTO: PokemonListDTO = {
    count: 150,
    next: 'https://pokeapi.co/api/v2/pokemon?offset=20&limit=20',
    previous: null,
    results: [
      { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
      { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/' },
    ],
  };

  const mockRawPokemonDTO: RawPokemonDTO = {
    id: 1,
    name: 'bulbasaur',
    height: 7,
    weight: 69,
    types: [
      { type: { name: 'grass' } },
      { type: { name: 'poison' } },
    ],
    stats: [
      { base_stat: 45, stat: { name: 'hp' } },
      { base_stat: 49, stat: { name: 'attack' } },
    ],
    moves: [
      { move: { name: 'razor-wind', url: 'https://pokeapi.co/api/v2/move/13/' } },
    ],
    sprites: {
      front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/pokemon/1.png',
      other: {
        'official-artwork': {
          front_default:
            'https://raw.githubusercontent.com/PokeAPI/sprites/master/pokemon/other/official-artwork/1.png',
        },
      },
    },
  };

  const mockSpeciesDTO = {
    id: 1,
    name: 'bulbasaur',
    flavor_text_entries: [
      {
        flavor_text: 'A small, plant-based Pokémon.',
        language: { name: 'en' },
        version: { name: 'red' },
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PokemonRepository, provideHttpClient(), provideHttpClientTesting()],
    });

    repository = TestBed.inject(PokemonRepository);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getList()', () => {
    it.each([
      { limit: 150, description: 'uses default limit 150' },
      { limit: 50, description: 'uses custom limit 50' },
      { limit: 20, description: 'uses custom limit 20' },
      { limit: 100, description: 'uses custom limit 100' },
      { limit: 200, description: 'uses custom limit 200' },
    ])('$description', ({ limit }) => {
      repository.getList(limit || undefined).subscribe(data => {
        expect(data).toEqual(mockPokemonListDTO);
      });

      const req = httpMock.expectOne(`https://pokeapi.co/api/v2/pokemon?limit=${limit}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPokemonListDTO);
    });
  });

  describe('getById()', () => {
    it.each([1, 25, 150])('should send GET to /pokemon/%i', (id) => {
      repository.getById(id).subscribe(data => {
        expect(data.id).toBe(id);
      });

      const mockData = { ...mockRawPokemonDTO, id };
      const req = httpMock.expectOne(`https://pokeapi.co/api/v2/pokemon/${id}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });
  });

  describe('getByUrl()', () => {
    it.each([
      'https://pokeapi.co/api/v2/pokemon/1/',
      'https://pokeapi.co/api/v2/pokemon/25/',
      'https://pokeapi.co/api/v2/pokemon/150/',
    ])('should send GET to %s', (url) => {
      repository.getByUrl(url).subscribe();

      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('GET');
      req.flush(mockRawPokemonDTO);
    });
  });

  describe('getSpecies()', () => {
    it.each([1, 25, 150])('should send GET to /pokemon-species/%i', (id) => {
      repository.getSpecies(id).subscribe(data => {
        expect(data.id).toBe(id);
      });

      const mockData = { ...mockSpeciesDTO, id };
      const req = httpMock.expectOne(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });

    it('should include flavor_text_entries in response', () => {
      const id = 1;

      repository.getSpecies(id).subscribe(data => {
        expect(data.flavor_text_entries).toBeDefined();
        expect(Array.isArray(data.flavor_text_entries)).toBe(true);
        expect(data.flavor_text_entries.length).toBeGreaterThan(0);
      });

      const req = httpMock.expectOne(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
      req.flush(mockSpeciesDTO);
    });
  });
});
