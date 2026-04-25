import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { FightWsMockService } from './fight-ws-mock.service';
import { TeamService } from '../team/team.service';
import { TeamSlot } from '../team/team.model';

const mockSlot = (slotIndex: 0 | 1 | 2): TeamSlot => ({
  slotIndex,
  pokedexId: 6 + slotIndex,
  name: `Pokemon${slotIndex}`,
  sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${6 + slotIndex}.png`,
  spriteBack: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${6 + slotIndex}.png`,
  types: ['fire'],
  hp: 78,
  hpMax: 78,
  stats: { hp: 78, attack: 84, defense: 78, specialAttack: 109, specialDefense: 85, speed: 100 },
  moves: [
    { slot: 0, name: 'flamethrower', frenchName: 'Lance-Flammes', type: 'fire', power: 90, accuracy: 100, damageClass: 'special' },
  ],
});

const mockTeamService = {
  slots: signal<(TeamSlot | null)[]>([mockSlot(0), mockSlot(1), mockSlot(2)]),
  firstPokemon: signal<number>(0),
};

describe('FightWsMockService', () => {
  let service: FightWsMockService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        FightWsMockService,
        { provide: TeamService, useValue: mockTeamService },
      ],
    });
    service = TestBed.inject(FightWsMockService);
  });

  afterEach(() => {
    service.reset();
    vi.useRealTimers();
  });

  it('passe de connecting à waiting_opponent puis in_fight', () => {
    service.connect(1);
    expect(service.connectionStatus()).toBe('connecting');

    vi.advanceTimersByTime(500);
    expect(service.connectionStatus()).toBe('waiting_opponent');

    vi.advanceTimersByTime(1000);
    expect(service.connectionStatus()).toBe('in_fight');
  });

  it('isConnected retourne true après connect', () => {
    service.connect(1);
    expect(service.isConnected(1)).toBe(true);
    expect(service.isConnected(2)).toBe(false);
  });

  it('construit une équipe joueur avec les 3 Pokémon de TeamService', () => {
    service.connect(1);
    vi.advanceTimersByTime(1500);
    expect(service.playerTeam().length).toBe(3);
  });

  it('isPendingAction est true après sendAttack et false après la réponse simulée', () => {
    service.connect(1);
    vi.advanceTimersByTime(1500);

    service.sendAttack(0, 0);
    expect(service.isPendingAction()).toBe(true);

    vi.advanceTimersByTime(800);
    expect(service.isPendingAction()).toBe(false);
  });

  it('isPendingAction est true après sendSwitch et false après la réponse simulée', () => {
    service.connect(1);
    vi.advanceTimersByTime(1500);

    service.sendSwitch(1);
    expect(service.isPendingAction()).toBe(true);

    vi.advanceTimersByTime(500);
    expect(service.isPendingAction()).toBe(false);
  });

  it('sendAttack réduit les HP de l\'adversaire et ajoute des logs avec turn_start', () => {
    service.connect(1);
    vi.advanceTimersByTime(1500);

    const hpBefore = service.opponentActivePokemon()!.hp;
    service.sendAttack(0, 0);
    vi.advanceTimersByTime(800);

    expect(service.opponentActivePokemon()!.hp).toBeLessThan(hpBefore);
    expect(service.log().some(e => e.type === 'turn_start')).toBe(true);
    expect(service.log().length).toBeGreaterThan(1);
  });

  it('termine le combat quand les HP adverses atteignent 0', () => {
    service.connect(1);
    vi.advanceTimersByTime(1500);

    for (let i = 0; i < 10; i++) {
      service.sendAttack(0, 0);
      vi.advanceTimersByTime(800);
      if (service.phase() === 'finished') break;
    }

    expect(service.phase()).toBe('finished');
    expect(service.winner()).toBe('Joueur');
    expect(service.isFinished()).toBe(true);
  });

  it('reset remet tous les signals à leur état initial', () => {
    service.connect(1);
    vi.advanceTimersByTime(1500);

    service.reset();

    expect(service.connectionStatus()).toBe('connecting');
    expect(service.phase()).toBeNull();
    expect(service.isPendingAction()).toBe(false);
    expect(service.isConnected(1)).toBe(false);
  });
});
