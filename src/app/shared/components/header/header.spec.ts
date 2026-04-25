import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Header } from './header';
import { FightWsService } from '../../../core/fight/fight-ws.service';

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

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([]),
        { provide: FightWsService, useValue: mockFightWsService },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
