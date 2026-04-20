import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TeamService } from './team.service';
import { Team, TeamMove, TeamSlot } from './team.model';

const apiResp = <T>(data: T) => ({ code: '200', message: 'OK', data });

const mockSlot: TeamSlot = {
  slotIndex: 0,
  pokedexId: 6,
  name: 'charizard',
  sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png',
  spriteBack: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/6.png',
  types: ['fire', 'flying'],
  hp: 78,
  hpMax: 78,
  stats: { hp: 78, attack: 84, defense: 78, specialAttack: 109, specialDefense: 85, speed: 100 },
  moves: [
    { slot: 0, name: 'Flamethrower', frenchName: 'Lance-Flammes', type: 'fire', power: 90, accuracy: 100, damageClass: 'special' },
    { slot: 1, name: 'Fire Blast', frenchName: 'Déflagration', type: 'fire', power: 110, accuracy: 85, damageClass: 'special' },
    { slot: 2, name: 'Wing Attack', frenchName: 'Coupvent', type: 'flying', power: 60, accuracy: 100, damageClass: 'physical' },
    { slot: 3, name: 'Slash', frenchName: 'Tranche', type: 'normal', power: 70, accuracy: 100, damageClass: 'physical' },
  ],
};

const mockTeam: Team = { userId: '1', firstPokemon: 0, slots: [mockSlot, null, null, null, null, null] };

describe('TeamService', () => {
  let service: TeamService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TeamService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TeamService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ─── HTTP Tests ────────────────────────────────────────────────────────────

  describe('loadTeam()', () => {
    it('sends GET /team and sets team signal', () => {
      service.loadTeam('1').subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/team') && r.method === 'GET');
      req.flush(apiResp(mockTeam));

      expect(service.team()).toEqual(mockTeam);
    });

    it('uses provided userId when response userId is missing', () => {
      service.loadTeam('fallback-id').subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/team') && r.method === 'GET');
      req.flush(apiResp({ ...mockTeam, userId: undefined }));

      expect(service.team().userId).toBe('fallback-id');
    });

    it('uses response userId when present', () => {
      service.loadTeam('fallback-id').subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/team') && r.method === 'GET');
      req.flush(apiResp({ ...mockTeam, userId: 'server-id' }));

      expect(service.team().userId).toBe('server-id');
    });
  });

  describe('saveTeam()', () => {
    it('sends PUT /team with current team', () => {
      service.saveTeam();

      const req = httpMock.expectOne(r => r.url.includes('/team') && r.method === 'PUT');
      expect(req.request.method).toBe('PUT');
      req.flush(apiResp(mockTeam));
    });

    it('updates team signal and sets isSaving to false on success', () => {
      service.saveTeam();
      expect(service.isSaving()).toBe(true);

      httpMock.expectOne(r => r.url.includes('/team') && r.method === 'PUT')
        .flush(apiResp(mockTeam));

      expect(service.team()).toEqual(mockTeam);
      expect(service.isSaving()).toBe(false);
    });

    it('sets isSaving to false on error', () => {
      service.saveTeam();

      httpMock.expectOne(r => r.url.includes('/team') && r.method === 'PUT')
        .flush(null, { status: 500, statusText: 'Server Error' });

      expect(service.isSaving()).toBe(false);
    });
  });

  // ─── Signal-only Tests (no HTTP) ──────────────────────────────────────────

  describe('setSlot()', () => {
    it('replaces a slot correctly', () => {
      const slot1: TeamSlot = { ...mockSlot, slotIndex: 1, pokedexId: 9, name: 'blastoise' };
      service.setSlot(1, slot1);
      expect(service.slots()[1]).toEqual(slot1);
    });
  });

  describe('clearSlot()', () => {
    it('sets slot to null', () => {
      service.setSlot(0, mockSlot);
      service.setSlot(1, { ...mockSlot, slotIndex: 1 });
      service.clearSlot(1);
      expect(service.slots()[1]).toBeNull();
    });

    it('updates firstPokemon when cleared slot was the first', () => {
      service.setSlot(0, mockSlot);
      service.setSlot(1, { ...mockSlot, slotIndex: 1 });
      // firstPokemon defaults to 0
      service.clearSlot(0);
      expect(service.firstPokemon()).toBe(1);
    });

    it('sets firstPokemon to 0 when no slots remain', () => {
      service.setSlot(0, mockSlot);
      service.clearSlot(0);
      expect(service.firstPokemon()).toBe(0);
    });
  });

  describe('moveSlot()', () => {
    it('swaps two slots', () => {
      const slot1: TeamSlot = { ...mockSlot, slotIndex: 1, pokedexId: 9, name: 'blastoise' };
      service.setSlot(0, mockSlot);
      service.setSlot(1, slot1);
      service.moveSlot(0, 1);
      expect(service.slots()[0]).toEqual(slot1);
      expect(service.slots()[1]).toEqual(mockSlot);
    });

    it('updates firstPokemon when the first slot is moved', () => {
      service.setSlot(0, mockSlot);
      service.setSlot(1, { ...mockSlot, slotIndex: 1 });
      service.moveSlot(0, 1);
      expect(service.firstPokemon()).toBe(1);
    });

    it('does nothing when fromIndex equals toIndex', () => {
      service.setSlot(0, mockSlot);
      const before = service.slots()[0];
      service.moveSlot(0, 0);
      expect(service.slots()[0]).toEqual(before);
    });
  });

  describe('setFirstPokemon()', () => {
    it('updates firstPokemon when slot is occupied', () => {
      service.setSlot(0, mockSlot);
      service.setSlot(2, { ...mockSlot, slotIndex: 2 });
      service.setFirstPokemon(2);
      expect(service.firstPokemon()).toBe(2);
    });

    it('ignores request when slot is null', () => {
      service.setFirstPokemon(3); // slot 3 is null
      expect(service.firstPokemon()).toBe(0); // unchanged
    });
  });

  describe('setMove() and clearMove()', () => {
    it('setMove() updates the correct move in a slot', () => {
      service.setSlot(0, mockSlot);
      const newMove: TeamMove = { slot: 1, name: 'Ember', frenchName: 'Braise', type: 'fire', power: 40, accuracy: 100, damageClass: 'special' };
      service.setMove(0, 1, newMove);
      expect((service.slots()[0] as TeamSlot).moves[1]).toEqual(newMove);
    });

    it('clearMove() resets a move to empty', () => {
      service.setSlot(0, mockSlot);
      service.clearMove(0, 2);
      const move = (service.slots()[0] as TeamSlot).moves[2];
      expect(move.name).toBe('');
      expect(move.slot).toBe(2);
    });

    it('setMove() does nothing when slot is null', () => {
      const before = service.slots()[3];
      service.setMove(3, 0, { slot: 0, name: 'Test', frenchName: 'Test', type: 'fire', power: 50, accuracy: 100, damageClass: 'special' });
      expect(service.slots()[3]).toEqual(before);
    });
  });

  describe('resetTeam()', () => {
    it('restores empty team with 6 null slots', () => {
      service.setSlot(0, mockSlot);
      service.resetTeam();
      expect(service.slots().every(s => s === null)).toBe(true);
      expect(service.slots().length).toBe(6);
      expect(service.team().userId).toBe('');
    });
  });
});
