import { describe, it, expect } from 'vitest';
import { PokemonMapper } from './pokemon.mapper';
import { RawPokemonDTO } from '../models/dto/pokemon.dto';

describe('PokemonMapper', () => {
  describe('toModel()', () => {
    const createBasicDTO = (): RawPokemonDTO => ({
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
        { base_stat: 49, stat: { name: 'defense' } },
        { base_stat: 65, stat: { name: 'special-attack' } },
        { base_stat: 65, stat: { name: 'special-defense' } },
        { base_stat: 45, stat: { name: 'speed' } },
      ],
      moves: [
        { move: { name: 'razor-wind', url: 'https://...' } },
        { move: { name: 'swords-dance', url: 'https://...' } },
      ],
      sprites: {
        front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
        other: {
          'official-artwork': {
            front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
          },
        },
      },
    });

    it('should map id and types correctly', () => {
      const dto = createBasicDTO();
      const result = PokemonMapper.toModel(dto);
      expect(result.id).toBe(1);
      expect(result.types).toEqual(['grass', 'poison']);
    });

    it('should use frenchName when provided', () => {
      const dto = createBasicDTO();
      const result = PokemonMapper.toModel(dto, 'Bulbizarre');
      expect(result.name).toBe('Bulbizarre');
    });

    it('should fall back to dto.name when no frenchName provided', () => {
      const dto = createBasicDTO();
      const result = PokemonMapper.toModel(dto);
      expect(result.name).toBe('bulbasaur');
    });

    it('should map stats in correct order (hp, attack, defense, specialAttack, specialDefense, speed)', () => {
      const dto = createBasicDTO();
      const result = PokemonMapper.toModel(dto);
      expect(result.stats).toEqual({
        hp: 45,
        attack: 49,
        defense: 49,
        specialAttack: 65,
        specialDefense: 65,
        speed: 45,
      });
    });

    it('should prioritize official-artwork image over front_default', () => {
      const dto = createBasicDTO();
      const result = PokemonMapper.toModel(dto);
      expect(result.image).toBe('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png');
    });

    it('should fall back to front_default sprite when official-artwork is missing', () => {
      const dto = createBasicDTO();
      dto.sprites.other['official-artwork'].front_default = undefined as any;
      const result = PokemonMapper.toModel(dto);
      expect(result.sprite).toBe('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png');
    });

    it('should map moves to name strings', () => {
      const dto = createBasicDTO();
      const result = PokemonMapper.toModel(dto);
      expect(result.moves).toEqual(['razor-wind', 'swords-dance']);
    });

    it('should map height and weight correctly', () => {
      const dto = createBasicDTO();
      const result = PokemonMapper.toModel(dto);
      expect(result.height).toBe(7);
      expect(result.weight).toBe(69);
    });
  });
});
