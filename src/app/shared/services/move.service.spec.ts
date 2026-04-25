import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { MoveService } from './move.service';
import { Move } from '../models/move.model';
import { RawMoveDTO } from '../models/dto/pokemon.dto';

/**
 * Helper factory to create Move objects with overrides.
 * Provides default values for all properties so tests can customize only what matters.
 */
function makeMoves(overrides?: Partial<Move>[]): Move[] {
  const defaults: Move = {
    name: 'move-name',
    frenchName: 'Nom-Français',
    type: 'normal',
    power: 50,
    accuracy: 100,
    damageClass: 'physical',
  };

  if (!overrides) {
    return [defaults];
  }

  return overrides.map(override => ({ ...defaults, ...override }));
}

/**
 * Helper factory to create RawMoveDTO objects.
 */
function makeRawMoves(count: number = 1): RawMoveDTO[] {
  return Array.from({ length: count }, (_, i) => ({
    move: {
      name: `move-${i}`,
      url: `https://pokeapi.co/api/v2/move/move-${i}`,
    },
  }));
}

describe('MoveService', () => {
  let service: MoveService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MoveService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(MoveService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ============================================================
  // A. filterMoves() Tests - Pure Filtering Logic
  // ============================================================
  describe('filterMoves()', () => {
    it('returns all moves when no criteria provided', () => {
      const moves = makeMoves([
        { name: 'tackle', power: 40 },
        { name: 'flamethrower', power: 90, type: 'fire' },
      ]);

      const result = service.filterMoves(moves);

      expect(result).toHaveLength(2);
      expect(result).toEqual(moves);
    });

    it('returns empty array for empty input', () => {
      const result = service.filterMoves([]);

      expect(result).toEqual([]);
    });

    it('returns empty array for null or undefined input', () => {
      expect(service.filterMoves(null as any)).toEqual([]);
      expect(service.filterMoves(undefined as any)).toEqual([]);
    });

    describe('minPower filtering', () => {
      it('filters by minPower - excludes moves with power below threshold', () => {
        const moves = makeMoves([
          { name: 'weak', power: 30 },
          { name: 'medium', power: 50 },
          { name: 'strong', power: 100 },
        ]);

        const result = service.filterMoves(moves, { minPower: 50 });

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('medium');
        expect(result[1].name).toBe('strong');
      });

      it('excludes moves with null power when minPower is set', () => {
        const moves = makeMoves([
          { name: 'status-move', power: null, damageClass: 'status' },
          { name: 'physical', power: 75 },
        ]);

        const result = service.filterMoves(moves, { minPower: 50 });

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('physical');
      });
    });

    describe('maxPower filtering', () => {
      it('filters by maxPower - excludes moves with power above threshold', () => {
        const moves = makeMoves([
          { name: 'weak', power: 30 },
          { name: 'medium', power: 60 },
          { name: 'strong', power: 100 },
        ]);

        const result = service.filterMoves(moves, { maxPower: 60 });

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('weak');
        expect(result[1].name).toBe('medium');
      });

      it('excludes moves with null power when maxPower is set', () => {
        const moves = makeMoves([
          { name: 'status-move', power: null },
          { name: 'physical', power: 50 },
        ]);

        const result = service.filterMoves(moves, { maxPower: 60 });

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('physical');
      });
    });

    it('combines minPower and maxPower with AND logic', () => {
      const moves = makeMoves([
        { name: 'weak', power: 20 },
        { name: 'medium', power: 60 },
        { name: 'strong', power: 100 },
      ]);

      const result = service.filterMoves(moves, { minPower: 50, maxPower: 80 });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('medium');
    });

    describe('damageClass filtering', () => {
      it('filters by damageClass - case insensitive', () => {
        const moves = makeMoves([
          { name: 'tackle', damageClass: 'physical' },
          { name: 'flamethrower', damageClass: 'special' },
          { name: 'thunder-wave', damageClass: 'status' },
        ]);

        const result = service.filterMoves(moves, { damageClass: 'PHYSICAL' });

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('tackle');
      });

      it('filters by damageClass - lowercase input', () => {
        const moves = makeMoves([
          { name: 'tackle', damageClass: 'Physical' },
          { name: 'flamethrower', damageClass: 'Special' },
        ]);

        const result = service.filterMoves(moves, { damageClass: 'physical' });

        expect(result).toHaveLength(1);
      });

      it('excludes moves without damageClass when filter is applied', () => {
        const moves = makeMoves([
          { name: 'valid', damageClass: 'physical' },
          { name: 'invalid', damageClass: '' },
        ]);

        const result = service.filterMoves(moves, { damageClass: 'physical' });

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('valid');
      });
    });

    describe('type filtering', () => {
      it('filters by type - case insensitive', () => {
        const moves = makeMoves([
          { name: 'flamethrower', type: 'fire' },
          { name: 'water-gun', type: 'water' },
          { name: 'tackle', type: 'normal' },
        ]);

        const result = service.filterMoves(moves, { type: 'FIRE' });

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('flamethrower');
      });

      it('filters by type - mixed case', () => {
        const moves = makeMoves([
          { name: 'flamethrower', type: 'Fire' },
          { name: 'water-gun', type: 'Water' },
        ]);

        const result = service.filterMoves(moves, { type: 'fire' });

        expect(result).toHaveLength(1);
      });

      it('excludes moves without type when filter is applied', () => {
        const moves = makeMoves([
          { name: 'valid', type: 'fire' },
          { name: 'invalid', type: '' },
        ]);

        const result = service.filterMoves(moves, { type: 'fire' });

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('valid');
      });
    });

    describe('minAccuracy filtering', () => {
      it('filters by minAccuracy - excludes moves below threshold', () => {
        const moves = makeMoves([
          { name: 'low-accuracy', accuracy: 50 },
          { name: 'high-accuracy', accuracy: 100 },
          { name: 'infallible', accuracy: null },
        ]);

        const result = service.filterMoves(moves, { minAccuracy: 90 });

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('high-accuracy');
      });

      it('excludes moves with null accuracy when minAccuracy is set', () => {
        const moves = makeMoves([
          { name: 'infallible', accuracy: null },
          { name: 'normal', accuracy: 80 },
        ]);

        const result = service.filterMoves(moves, { minAccuracy: 75 });

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('normal');
      });
    });

    it('combines multiple filters with AND logic', () => {
      const moves = makeMoves([
        { name: 'tackle', type: 'normal', damageClass: 'physical', power: 40, accuracy: 100 },
        { name: 'flamethrower', type: 'fire', damageClass: 'special', power: 90, accuracy: 100 },
        { name: 'water-gun', type: 'water', damageClass: 'special', power: 40, accuracy: 100 },
      ]);

      const result = service.filterMoves(moves, {
        type: 'fire',
        damageClass: 'special',
        minPower: 80,
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('flamethrower');
    });

    it('returns copy of array when no criteria, not reference', () => {
      const moves = makeMoves([{ name: 'move1' }]);
      const result = service.filterMoves(moves);

      expect(result).not.toBe(moves);
      expect(result).toEqual(moves);
    });
  });

  // ============================================================
  // B. getFrenchName() Tests - HTTP + Caching
  // ============================================================
  describe('getFrenchName()', () => {
    it('fetches french name from API', () => {
      let result: string | undefined;
      service.getFrenchName('flamethrower').subscribe(name => {
        result = name;
      });

      const req = httpMock.expectOne(r => r.url.includes('/move/flamethrower'));
      expect(req.request.method).toBe('GET');
      req.flush({
        name: 'flamethrower',
        names: [
          { language: { name: 'en' }, name: 'Flamethrower' },
          { language: { name: 'fr' }, name: 'Lance-Flammes' },
        ],
      });

      expect(result).toBe('Lance-Flammes');
    });

    it('normalizes slug - converts to lowercase', () => {
      service.getFrenchName('Flamethrower').subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/move/flamethrower'));
      req.flush({ names: [{ language: { name: 'fr' }, name: 'Lance-Flammes' }] });
    });

    it('normalizes slug - replaces spaces with dashes', () => {
      service.getFrenchName('Fire Blast').subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/move/fire-blast'));
      req.flush({ names: [{ language: { name: 'fr' }, name: 'Éclat-Vent' }] });
    });

    it('normalizes slug - multiple spaces to single dash', () => {
      service.getFrenchName('Multi  Space   Move').subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/move/multi-space-move'));
      req.flush({ names: [] });
    });

    it('returns slug as fallback when HTTP error occurs', () => {
      let result: string | undefined;
      service.getFrenchName('unknown-move').subscribe(name => {
        result = name;
      });

      const req = httpMock.expectOne(r => r.url.includes('/move/unknown-move'));
      req.error(new ErrorEvent('Network error'), { status: 404 });

      expect(result).toBe('unknown-move');
    });

    it('returns slug as fallback when no french name in response', () => {
      let result: string | undefined;
      service.getFrenchName('flamethrower').subscribe(name => {
        result = name;
      });

      const req = httpMock.expectOne(r => r.url.includes('/move/flamethrower'));
      req.flush({
        name: 'flamethrower',
        names: [
          { language: { name: 'en' }, name: 'Flamethrower' },
          { language: { name: 'de' }, name: 'Flammenwerfer' },
        ],
      });

      expect(result).toBe('flamethrower');
    });

    it('returns slug as fallback when names array is missing', () => {
      let result: string | undefined;
      service.getFrenchName('flamethrower').subscribe(name => {
        result = name;
      });

      const req = httpMock.expectOne(r => r.url.includes('/move/flamethrower'));
      req.flush({ name: 'flamethrower' });

      expect(result).toBe('flamethrower');
    });

    it('caches result - second call does not make HTTP request', () => {
      let result1: string | undefined;
      let result2: string | undefined;

      service.getFrenchName('flamethrower').subscribe(name => {
        result1 = name;
      });

      const req = httpMock.expectOne(r => r.url.includes('/move/flamethrower'));
      req.flush({
        names: [
          { language: { name: 'fr' }, name: 'Lance-Flammes' },
        ],
      });

      service.getFrenchName('flamethrower').subscribe(name => {
        result2 = name;
      });

      httpMock.expectNone(r => r.url.includes('/move/flamethrower'));
      expect(result1).toBe('Lance-Flammes');
      expect(result2).toBe('Lance-Flammes');
    });

    it('cache key is normalized (different cases should hit same cache)', () => {
      let result1: string | undefined;
      let result2: string | undefined;

      service.getFrenchName('Fire Blast').subscribe(name => {
        result1 = name;
      });

      const req = httpMock.expectOne(r => r.url.includes('/move/fire-blast'));
      req.flush({
        names: [
          { language: { name: 'fr' }, name: 'Éclat-Vent' },
        ],
      });

      service.getFrenchName('FIRE BLAST').subscribe(name => {
        result2 = name;
      });

      httpMock.expectNone(r => r.url.includes('/move/'));
      expect(result1).toBe('Éclat-Vent');
      expect(result2).toBe('Éclat-Vent');
    });
  });

  // ============================================================
  // C. loadMovesFromDtos() Tests - HTTP Orchestration + Filtering
  // ============================================================
  describe('loadMovesFromDtos()', () => {
    it('returns empty array immediately for empty input', () => {
      let result: Move[] | undefined;

      service.loadMovesFromDtos([]).subscribe(moves => {
        result = moves;
      });

      expect(result).toEqual([]);
      httpMock.expectNone(r => true);
    });

    it('returns empty array immediately for null input', () => {
      let result: Move[] | undefined;

      service.loadMovesFromDtos(null as any).subscribe(moves => {
        result = moves;
      });

      expect(result).toEqual([]);
    });

    it('returns empty array immediately for undefined input', () => {
      let result: Move[] | undefined;

      service.loadMovesFromDtos(undefined as any).subscribe(moves => {
        result = moves;
      });

      expect(result).toEqual([]);
    });

    it('filters out status moves (damageClass=status)', () => {
      let result: Move[] | undefined;
      const rawMoves = makeRawMoves(3);

      service.loadMovesFromDtos(rawMoves).subscribe(moves => {
        result = moves;
      });

      httpMock.match(r => r.url.includes('/move/move-')).forEach((req, index) => {
        if (index === 0) {
          req.flush({
            name: 'move-0',
            names: [],
            type: { name: 'normal' },
            power: 50,
            accuracy: 100,
            damage_class: { name: 'physical' },
          });
        } else if (index === 1) {
          req.flush({
            name: 'move-1',
            names: [],
            type: { name: 'normal' },
            power: null,
            accuracy: null,
            damage_class: { name: 'status' },
          });
        } else {
          req.flush({
            name: 'move-2',
            names: [],
            type: { name: 'normal' },
            power: 50,
            accuracy: 100,
            damage_class: { name: 'special' },
          });
        }
      });

      expect(result).toHaveLength(2);
      expect(result!.every(m => m.damageClass !== 'status')).toBe(true);
    });

    it('filters out weak moves (power <= 30)', () => {
      let result: Move[] | undefined;
      const rawMoves = makeRawMoves(3);

      service.loadMovesFromDtos(rawMoves).subscribe(moves => {
        result = moves;
      });

      httpMock.match(r => r.url.includes('/move/move-')).forEach((req, index) => {
        if (index === 0) {
          req.flush({
            name: 'move-0',
            names: [],
            power: 30,
            damage_class: { name: 'physical' },
          });
        } else if (index === 1) {
          req.flush({
            name: 'move-1',
            names: [],
            power: null,
            damage_class: { name: 'physical' },
          });
        } else {
          req.flush({
            name: 'move-2',
            names: [],
            power: 50,
            damage_class: { name: 'physical' },
          });
        }
      });

      expect(result).toHaveLength(1);
      expect(result![0].power).toBe(50);
    });

    it('only returns moves with damageClass physical or special', () => {
      let result: Move[] | undefined;
      const rawMoves = makeRawMoves(4);

      service.loadMovesFromDtos(rawMoves).subscribe(moves => {
        result = moves;
      });

      httpMock.match(r => r.url.includes('/move/move-')).forEach((req, index) => {
        const damageClasses = ['physical', 'status', 'special', 'other'];
        req.flush({
          name: `move-${index}`,
          names: [],
          power: 50,
          damage_class: { name: damageClasses[index] },
        });
      });

      expect(result).toHaveLength(2);
      expect(result!.every(m => m.damageClass === 'physical' || m.damageClass === 'special')).toBe(
        true
      );
    });

    it('sorts results by type alphabetically (case insensitive)', () => {
      let result: Move[] | undefined;
      const rawMoves = makeRawMoves(4);

      service.loadMovesFromDtos(rawMoves).subscribe(moves => {
        result = moves;
      });

      const typeOrder = ['water', 'fire', 'psychic', 'electric'];
      httpMock.match(r => r.url.includes('/move/move-')).forEach((req, index) => {
        req.flush({
          name: `move-${index}`,
          names: [],
          power: 50,
          type: { name: typeOrder[index] },
          damage_class: { name: index % 2 === 0 ? 'physical' : 'special' },
        });
      });

      const types = result!.map(m => m.type.toLowerCase());
      expect(types).toEqual([...types].sort());
    });

    it('maps move DTOs correctly', () => {
      let result: Move[] | undefined;
      const rawMoves = makeRawMoves(1);

      service.loadMovesFromDtos(rawMoves).subscribe(moves => {
        result = moves;
      });

      const req = httpMock.expectOne(r => r.url.includes('/move/move-0'));
      req.flush({
        name: 'flamethrower',
        names: [
          { language: { name: 'fr' }, name: 'Lance-Flammes' },
        ],
        type: { name: 'fire' },
        power: 90,
        accuracy: 100,
        damage_class: { name: 'special' },
      });

      expect(result![0]).toEqual({
        name: 'flamethrower',
        frenchName: 'Lance-Flammes',
        type: 'fire',
        power: 90,
        accuracy: 100,
        damageClass: 'special',
      });
    });

    it('uses fallback type=normal when type is missing', () => {
      let result: Move[] | undefined;
      const rawMoves = makeRawMoves(1);

      service.loadMovesFromDtos(rawMoves).subscribe(moves => {
        result = moves;
      });

      const req = httpMock.expectOne(r => r.url.includes('/move/move-0'));
      req.flush({
        name: 'mystery-move',
        names: [],
        power: 50,
        damage_class: { name: 'physical' },
      });

      expect(result![0].type).toBe('normal');
    });

    it('uses fallback damageClass=physical when damageClass is missing', () => {
      let result: Move[] | undefined;
      const rawMoves = makeRawMoves(1);

      service.loadMovesFromDtos(rawMoves).subscribe(moves => {
        result = moves;
      });

      const req = httpMock.expectOne(r => r.url.includes('/move/move-0'));
      req.flush({
        name: 'mystery-move',
        names: [],
        power: 50,
        type: { name: 'normal' },
      });

      expect(result![0].damageClass).toBe('physical');
    });

    it('handles null power correctly (converted to null)', () => {
      let result: Move[] | undefined;
      const rawMoves = makeRawMoves(1);

      service.loadMovesFromDtos(rawMoves).subscribe(moves => {
        result = moves;
      });

      const req = httpMock.expectOne(r => r.url.includes('/move/move-0'));
      req.flush({
        name: 'status-move',
        names: [],
        power: null,
        damage_class: { name: 'physical' },
      });

      // This move should be filtered out since power is null
      expect(result).toHaveLength(0);
    });

    it('combines multiple filtering conditions correctly', () => {
      let result: Move[] | undefined;
      const rawMoves = makeRawMoves(6);

      service.loadMovesFromDtos(rawMoves).subscribe(moves => {
        result = moves;
      });

      const testCases = [
        { power: 40, damageClass: 'physical' }, // should include
        { power: 30, damageClass: 'physical' }, // filtered: power == 30
        { power: 50, damageClass: 'status' }, // filtered: status move
        { power: null, damageClass: 'physical' }, // filtered: no power
        { power: 100, damageClass: 'special' }, // should include
        { power: 25, damageClass: 'special' }, // filtered: power < 30
      ];

      httpMock.match(r => r.url.includes('/move/move-')).forEach((req, index) => {
        const tc = testCases[index];
        req.flush({
          name: `move-${index}`,
          names: [],
          type: { name: 'normal' },
          power: tc.power,
          damage_class: { name: tc.damageClass },
        });
      });

      // Only physical/special moves with power > 30 should remain
      expect(result!.length).toBeGreaterThan(0);
      expect(result!.every(m => m.power !== null && m.power > 30)).toBe(true);
      expect(result!.every(m => m.damageClass === 'physical' || m.damageClass === 'special')).toBe(
        true
      );
    });

    it('processes multiple moves via forkJoin', () => {
      let result: Move[] | undefined;
      const rawMoves = makeRawMoves(3);

      service.loadMovesFromDtos(rawMoves).subscribe(moves => {
        result = moves;
      });

      const reqs = httpMock.match(r => r.url.includes('/move/move-'));
      expect(reqs).toHaveLength(3);

      reqs.forEach((req, index) => {
        req.flush({
          name: `move-${index}`,
          names: [],
          type: { name: 'normal' },
          power: 50,
          damage_class: { name: 'physical' },
        });
      });

      expect(result!.length).toBeGreaterThan(0);
    });
  });
});
