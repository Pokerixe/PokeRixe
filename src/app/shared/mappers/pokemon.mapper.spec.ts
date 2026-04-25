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

    it('should map id correctly', () => {
      const dto = createBasicDTO();
      const result = PokemonMapper.toModel(dto);
      expect(result.id).toBe(1);
    });

    it('should map types correctly', () => {
      const dto = createBasicDTO();
      const result = PokemonMapper.toModel(dto);
      expect(result.types).toEqual(['grass', 'poison']);
      expect(result.types).toHaveLength(2);
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

    it('should fall back to dto.name when frenchName is undefined', () => {
      const dto = createBasicDTO();
      const result = PokemonMapper.toModel(dto, undefined);
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

    it('should use front_default as sprite property when available', () => {
      const dto = createBasicDTO();
      const result = PokemonMapper.toModel(dto);
      expect(result.sprite).toBe('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png');
    });

    it('should fall back to empty string when both sprites are missing', () => {
      const dto = createBasicDTO();
      dto.sprites.front_default = '' as any;
      dto.sprites.other['official-artwork'].front_default = undefined as any;
      const result = PokemonMapper.toModel(dto);
      expect(result.sprite).toBe('');
    });

    it('should map moves to name strings', () => {
      const dto = createBasicDTO();
      const result = PokemonMapper.toModel(dto);
      expect(result.moves).toEqual(['razor-wind', 'swords-dance']);
      expect(result.moves).toHaveLength(2);
    });

    it('should handle Pokemon with no moves', () => {
      const dto = createBasicDTO();
      dto.moves = [];
      const result = PokemonMapper.toModel(dto);
      expect(result.moves).toEqual([]);
    });

    it('should map height and weight correctly', () => {
      const dto = createBasicDTO();
      const result = PokemonMapper.toModel(dto);
      expect(result.height).toBe(7);
      expect(result.weight).toBe(69);
    });

    it('should handle single type Pokemon', () => {
      const dto = createBasicDTO();
      dto.types = [{ type: { name: 'fire' } }];
      const result = PokemonMapper.toModel(dto);
      expect(result.types).toEqual(['fire']);
      expect(result.types).toHaveLength(1);
    });

    it('should handle Pokemon with multiple moves', () => {
      const dto = createBasicDTO();
      dto.moves = [
        { move: { name: 'move1', url: 'https://...' } },
        { move: { name: 'move2', url: 'https://...' } },
        { move: { name: 'move3', url: 'https://...' } },
        { move: { name: 'move4', url: 'https://...' } },
      ];
      const result = PokemonMapper.toModel(dto);
      expect(result.moves).toEqual(['move1', 'move2', 'move3', 'move4']);
    });

    it('should return valid Pokemon object with all required properties', () => {
      const dto = createBasicDTO();
      const result = PokemonMapper.toModel(dto);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('types');
      expect(result).toHaveProperty('image');
      expect(result).toHaveProperty('sprite');
      expect(result).toHaveProperty('height');
      expect(result).toHaveProperty('weight');
      expect(result).toHaveProperty('stats');
      expect(result).toHaveProperty('moves');
    });

    it('should preserve order of stats array mapping', () => {
      const dto = createBasicDTO();
      dto.stats = [
        { base_stat: 100, stat: { name: 'hp' } },
        { base_stat: 110, stat: { name: 'attack' } },
        { base_stat: 120, stat: { name: 'defense' } },
        { base_stat: 130, stat: { name: 'special-attack' } },
        { base_stat: 140, stat: { name: 'special-defense' } },
        { base_stat: 150, stat: { name: 'speed' } },
      ];
      const result = PokemonMapper.toModel(dto);
      expect(result.stats.hp).toBe(100);
      expect(result.stats.attack).toBe(110);
      expect(result.stats.defense).toBe(120);
      expect(result.stats.specialAttack).toBe(130);
      expect(result.stats.specialDefense).toBe(140);
      expect(result.stats.speed).toBe(150);
    });
  });
});
