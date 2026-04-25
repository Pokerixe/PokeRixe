import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { App } from './app';
import { FightWsService } from './core/fight/fight-ws.service';

const mockFightWsService = {
  isFinished: signal(false),
  phase: signal(null),
  playerActivePokemon: signal(null), opponentActivePokemon: signal(null),
  playerTeam: signal([]), playerHasActed: signal(false), mustSwitch: signal(false),
  log: signal([]), winner: signal(null), error: signal(null),
  connectionStatus: signal('connecting' as const), opponentName: signal(''),
  playerName: signal(''), opponentRemainingCount: signal(0), isPendingAction: signal(false),
  connect: () => {}, isConnected: () => false, sendAttack: () => {}, sendSwitch: () => {}, reset: () => {},
};

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: FightWsService, useValue: mockFightWsService },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
