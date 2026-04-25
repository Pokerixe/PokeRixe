import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { Fight } from './fight';
import { ConnectionStatus, FightWsService } from '../../core/fight/fight-ws.service';
import { FightPokemonState } from '../../core/fight/fight.model';

const makeMockService = () => ({
  phase: signal<import('../../core/fight/fight.model').FightPhase | null>(null),
  playerActivePokemon: signal<FightPokemonState | null>(null),
  opponentActivePokemon: signal<FightPokemonState | null>(null),
  playerTeam: signal<FightPokemonState[]>([]),
  playerHasActed: signal(false),
  mustSwitch: signal(false),
  log: signal<import('../../core/fight/fight.model').TurnEvent[]>([]),
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

describe('Fight', () => {
  let component: Fight;
  let fixture: ComponentFixture<Fight>;
  let mockService: ReturnType<typeof makeMockService>;

  beforeEach(async () => {
    mockService = makeMockService();

    await TestBed.configureTestingModule({
      imports: [Fight],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => '1' } },
            paramMap: of({ get: () => '1' }),
          },
        },
        { provide: FightWsService, useValue: mockService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Fight);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('appelle connect() si la socket n\'est pas déjà ouverte', () => {
    expect(mockService.connect).toHaveBeenCalledWith(1);
  });

  describe('quand isConnected retourne true', () => {
    let localService: ReturnType<typeof makeMockService>;

    beforeEach(async () => {
      TestBed.resetTestingModule();
      localService = makeMockService();
      localService.isConnected.mockReturnValue(true);

      await TestBed.configureTestingModule({
        imports: [Fight],
        providers: [
          provideRouter([]),
          { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } }, paramMap: of({ get: () => '1' }) } },
          { provide: FightWsService, useValue: localService },
        ],
      }).compileComponents();

      TestBed.createComponent(Fight);
    });

    it('n\'appelle pas connect()', () => {
      expect(localService.connect).not.toHaveBeenCalled();
    });
  });

  it('affiche l\'écran de connexion quand connectionStatus est connecting', () => {
    mockService.connectionStatus.set('connecting');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.fight-overlay')).toBeTruthy();
    expect(el.querySelector('.fight-main')).toBeFalsy();
  });

  it('affiche l\'écran d\'attente adversaire quand connectionStatus est waiting_opponent', () => {
    mockService.connectionStatus.set('waiting_opponent');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.fight-overlay')).toBeTruthy();
    expect(el.textContent).toContain('adversaire');
  });

  it('affiche l\'interface de combat quand connectionStatus est in_fight', () => {
    mockService.connectionStatus.set('in_fight');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.fight-main')).toBeTruthy();
  });

  it('affiche l\'écran de déconnexion quand connectionStatus est disconnected', () => {
    mockService.connectionStatus.set('disconnected');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.fight-overlay-error')).toBeTruthy();
    expect(el.querySelector('.btn-retry')).toBeTruthy();
  });

  it('les boutons de switch sont désactivés quand isPendingAction est true', () => {
    mockService.connectionStatus.set('in_fight');
    mockService.playerTeam.set([{
      slotIndex: 0, pokedexId: 1, name: 'Bulbizarre',
      sprite: '', spriteBack: '', types: ['grass'],
      hp: 45, hpMax: 45, isFainted: false,
    }]);
    mockService.isPendingAction.set(true);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('app-fight-pokemon-card');
    expect(card).toBeTruthy();
    expect(component.canAct()).toBe(false);
  });
});
