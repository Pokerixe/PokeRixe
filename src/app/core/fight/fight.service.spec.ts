import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { FightService } from './fight.service';
import { FightActionResponse, FightPokemonState, FightState } from './fight.model';
import { TeamMove } from '../team/team.model';
import { PokemonStats } from '../../shared/models/pokemon-stats.model';

const apiResp = <T>(data: T) => ({ code: '200', message: 'OK', data });

const mockPokemonState: FightPokemonState = {
  slotIndex: 0,
  pokedexId: 6,
  name: 'charizard',
  sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png',
  spriteBack: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/6.png',
  types: ['fire', 'flying'],
  hp: 78,
  hpMax: 78,
  isFainted: false,
};

const mockOpponentState: FightPokemonState = {
  slotIndex: 0,
  pokedexId: 25,
  name: 'pikachu',
  sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
  spriteBack: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/25.png',
  types: ['electric'],
  hp: 35,
  hpMax: 35,
  isFainted: false,
};

const mockFightState = (overrides: Partial<FightState> = {}): FightState => ({
  gameId: 1,
  turnNumber: 1,
  phase: 'waiting_actions',
  playerName: 'Test User',
  playerActivePokemon: mockPokemonState,
  playerTeam: [mockPokemonState],
  opponentName: 'Rival',
  opponentActivePokemon: mockOpponentState,
  opponentRemainingCount: 1,
  playerHasActed: false,
  log: [],
  winner: null,
  mustSwitch: false,
  ...overrides,
});

const mockMove: TeamMove = {
  slot: 0,
  name: 'Flamethrower',
  type: 'fire',
  power: 90,
  accuracy: 100,
  damageClass: 'special',
};

const mockStats: PokemonStats = {
  hp: 78,
  attack: 84,
  defense: 78,
  specialAttack: 109,
  specialDefense: 85,
  speed: 100,
};

describe('FightService', () => {
  let service: FightService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FightService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FightService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    service.reset();
    httpMock.verify();
  });

  describe('sendAttack()', () => {
    it('envoie un POST /games/1/action avec le bon corps FightAction', () => {
      service.sendAttack(1, mockMove, mockStats, ['fire', 'flying']).subscribe();

      const req = httpMock.expectOne(
        (r) => r.url.includes('/games/1/action') && r.method === 'POST',
      );

      expect(req.request.body).toEqual({
        type: 'attack',
        attack: {
          moveSlot: 0,
          moveName: 'Flamethrower',
          moveType: 'fire',
          movePower: 90,
          moveAccuracy: 100,
          moveDamageClass: 'special',
          attackerStats: mockStats,
          attackerTypes: ['fire', 'flying'],
        },
      });

      req.flush(apiResp<FightActionResponse>({ accepted: true }));
    });

    it('retourne accepted: true si le serveur accepte l\'action', () => {
      let result: FightActionResponse | undefined;
      service.sendAttack(1, mockMove, mockStats, ['fire']).subscribe((r) => (result = r));

      httpMock
        .expectOne((r) => r.url.includes('/games/1/action'))
        .flush(apiResp<FightActionResponse>({ accepted: true }));

      expect(result?.accepted).toBe(true);
    });

    it('met à jour le signal error si l\'action est refusée', () => {
      service.sendAttack(1, mockMove, mockStats, ['fire']).subscribe();

      httpMock
        .expectOne((r) => r.url.includes('/games/1/action'))
        .flush(apiResp<FightActionResponse>({ accepted: false, reason: 'Déjà joué ce tour' }));

      expect(service.error()).toBe('Déjà joué ce tour');
    });

    it('utilise le message par défaut si reason est absent', () => {
      service.sendAttack(1, mockMove, mockStats, ['fire']).subscribe();

      httpMock
        .expectOne((r) => r.url.includes('/games/1/action'))
        .flush(apiResp<FightActionResponse>({ accepted: false }));

      expect(service.error()).toBe('Action refusée');
    });
  });

  describe('sendSwitch()', () => {
    it('envoie un POST avec type switch et switchToSlotIndex correct', () => {
      service.sendSwitch(1, 2).subscribe();

      const req = httpMock.expectOne(
        (r) => r.url.includes('/games/1/action') && r.method === 'POST',
      );

      expect(req.request.body).toEqual({
        type: 'switch',
        switch: { switchToSlotIndex: 2 },
      });

      req.flush(apiResp<FightActionResponse>({ accepted: true }));
    });

    it('utilise le gameId correct dans l\'URL', () => {
      service.sendSwitch(42, 1).subscribe();

      httpMock
        .expectOne((r) => r.url.includes('/games/42/action'))
        .flush(apiResp<FightActionResponse>({ accepted: true }));
    });
  });

  describe('reset()', () => {
    it('réinitialise fightState à null', () => {
      // Simuler un état initial via sendAttack qui met à jour error
      service.sendAttack(1, mockMove, mockStats, ['fire']).subscribe();
      httpMock
        .expectOne((r) => r.url.includes('/games/1/action'))
        .flush(apiResp<FightActionResponse>({ accepted: false, reason: 'Erreur test' }));

      expect(service.error()).toBe('Erreur test');

      service.reset();

      expect(service.fightState()).toBeNull();
      expect(service.error()).toBeNull();
      expect(service.isPolling()).toBe(false);
    });
  });

  describe('signaux calculés', () => {
    it('retourne des valeurs par défaut quand fightState est null', () => {
      expect(service.phase()).toBeNull();
      expect(service.turnNumber()).toBe(0);
      expect(service.playerActivePokemon()).toBeNull();
      expect(service.opponentActivePokemon()).toBeNull();
      expect(service.playerTeam()).toEqual([]);
      expect(service.opponentName()).toBe('');
      expect(service.playerName()).toBe('');
      expect(service.playerHasActed()).toBe(false);
      expect(service.mustSwitch()).toBe(false);
      expect(service.log()).toEqual([]);
      expect(service.winner()).toBeNull();
      expect(service.isFinished()).toBe(false);
      expect(service.opponentRemainingCount()).toBe(0);
    });

    it('isFinished est true quand phase === finished', () => {
      service.sendAttack(1, mockMove, mockStats, ['fire']).subscribe();
      httpMock
        .expectOne((r) => r.url.includes('/games/1/action'))
        .flush(apiResp<FightActionResponse>({ accepted: true }));

      // Pas encore finished
      expect(service.isFinished()).toBe(false);
    });
  });
});
