import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { SearchGame } from './search-game';
import { ConnectionStatus, FightWsService } from '../../core/fight/fight-ws.service';
import { signal } from '@angular/core';
import { FightPokemonState, FightPhase, TurnEvent } from '../../core/fight/fight.model';

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

describe('SearchGame', () => {
  let component: SearchGame;
  let fixture: ComponentFixture<SearchGame>;
  let mockFightWsService: ReturnType<typeof makeMockFightWsService>;

  beforeEach(async () => {
    mockFightWsService = makeMockFightWsService();

    await TestBed.configureTestingModule({
      imports: [SearchGame],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: FightWsService, useValue: mockFightWsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchGame);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
