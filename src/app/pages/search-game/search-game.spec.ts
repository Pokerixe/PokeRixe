import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { SearchGame } from './search-game';
import { ConnectionStatus, FightWsService } from '../../core/fight/fight-ws.service';
import { signal } from '@angular/core';
import { FightPokemonState, FightPhase, TurnEvent } from '../../core/fight/fight.model';
import { TeamService } from '../../core/team/team.service';
import { TeamSlot } from '../../core/team/team.model';

const makeMockFightWsService = () => ({
  phase: signal<FightPhase | null>(null),
  playerActivePokemon: signal<FightPokemonState | null>(null),
  opponentActivePokemon: signal<FightPokemonState | null>(null),
  playerTeam: signal<FightPokemonState[]>([]),
  playerHasActed: signal(false),
  mustSwitch: signal(false),
  log: signal<TurnEvent[]>([]),
  winner: signal<string | null>(null),
  isFinished: signal(false),
  error: signal<string | null>(null),
  connectionStatus: signal<ConnectionStatus>('connecting'),
  opponentName: signal(''),
  playerName: signal(''),
  opponentRemainingCount: signal(0),
  isPendingAction: signal(false),
  connect: vi.fn(),
  isConnected: vi.fn().mockReturnValue(false),
  sendAttack: vi.fn(),
  sendSwitch: vi.fn(),
  reset: vi.fn(),
});

const mockTeamSlot: TeamSlot = {
  slotIndex: 0,
  pokedexId: 25,
  name: 'Pikachu',
  sprite: '',
  spriteBack: '',
  types: ['electric'],
  hp: 35,
  hpMax: 35,
  stats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90 },
  moves: [],
};

const mockGame = { id: 42, player1: 'player1', player2: null, status: 'waiting' as any };
const apiResp = <T>(data: T) => ({ code: '200', message: 'OK', data });

describe('SearchGame', () => {
  let component: SearchGame;
  let fixture: ComponentFixture<SearchGame>;
  let mockFightWsService: ReturnType<typeof makeMockFightWsService>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    mockFightWsService = makeMockFightWsService();

    await TestBed.configureTestingModule({
      imports: [SearchGame],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', redirectTo: '' }]),
        { provide: FightWsService, useValue: mockFightWsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchGame);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    const loadReq = httpMock.expectOne(r => r.url.includes('games') && r.method === 'GET');
    loadReq.flush(apiResp([]));

    await fixture.whenStable();
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('openCreateGame() / closeCreateGame()', () => {
    it('opens the create modal and locks scroll', () => {
      component.openCreateGame();
      expect(component.createModalOpen()).toBe(true);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('closes the create modal and unlocks scroll', () => {
      component.openCreateGame();
      component.closeCreateGame();
      expect(component.createModalOpen()).toBe(false);
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('submitCreateGame()', () => {
    it('creates a game, connects the WebSocket and closes the modal', () => {
      component.description.set('Test game');
      component.openCreateGame();
      component.submitCreateGame();

      const req = httpMock.expectOne(r => r.url.endsWith('/games') && r.method === 'POST');
      req.flush(apiResp(mockGame));

      expect(mockFightWsService.connect).toHaveBeenCalledWith(42);
      expect(component.createModalOpen()).toBe(false);
    });

    it('uses 1 as nombrePokemon when all team slots are empty', () => {
      component.submitCreateGame();

      const req = httpMock.expectOne(r => r.url.endsWith('/games') && r.method === 'POST');
      expect(req.request.body.nombrePokemon).toBe(1);
      req.flush(apiResp(mockGame));
    });

    it('counts non-null slots for nombrePokemon', () => {
      const teamService = TestBed.inject(TeamService);
      teamService.setSlot(0, mockTeamSlot);
      teamService.setSlot(1, { ...mockTeamSlot, slotIndex: 1 });
      component.submitCreateGame();

      const req = httpMock.expectOne(r => r.url.endsWith('/games') && r.method === 'POST');
      expect(req.request.body.nombrePokemon).toBe(2);
      req.flush(apiResp(mockGame));
    });
  });

  describe('openJoinModal() / closeJoinModal()', () => {
    it('opens the join modal, clears the slot selection and locks scroll', () => {
      component.selectedTeamSlot.set(3);
      component.openJoinModal();
      expect(component.joinModalOpen()).toBe(true);
      expect(component.selectedTeamSlot()).toBeNull();
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('closes the join modal, resets gameId and unlocks scroll', () => {
      component.openJoinModal();
      component.selectedGameId.set(5);
      component.closeJoinModal();
      expect(component.joinModalOpen()).toBe(false);
      expect(component.selectedGameId()).toBeNull();
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('selectTeamSlot()', () => {
    it('sets the selected slot index', () => {
      component.selectTeamSlot(2);
      expect(component.selectedTeamSlot()).toBe(2);
    });
  });

  describe('confirmJoin()', () => {
    it('does nothing when no team slot is selected', () => {
      component.selectedTeamSlot.set(null);
      component.confirmJoin();
      httpMock.expectNone(r => r.url.includes('join'));
    });

    it('does nothing when the selected slot is empty (null)', () => {
      component.selectedTeamSlot.set(0);
      component.confirmJoin();
      httpMock.expectNone(r => r.url.includes('join'));
    });

    it('does nothing when no game id is set', () => {
      const teamService = TestBed.inject(TeamService);
      teamService.setSlot(0, mockTeamSlot);
      component.selectedTeamSlot.set(0);
      component.selectedGameId.set(null);
      component.confirmJoin();
      httpMock.expectNone(r => r.url.includes('join'));
    });

    it('joins the game, connects the WebSocket and closes the modal on success', () => {
      const teamService = TestBed.inject(TeamService);
      teamService.setSlot(0, mockTeamSlot);
      component.selectedTeamSlot.set(0);
      component.selectedGameId.set(10);
      component.confirmJoin();

      const req = httpMock.expectOne(r => r.url.includes('games/10/join') && r.method === 'POST');
      req.flush(apiResp(mockGame));

      expect(mockFightWsService.connect).toHaveBeenCalledWith(42);
      expect(component.joinModalOpen()).toBe(false);
    });
  });
});
