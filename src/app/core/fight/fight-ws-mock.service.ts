import { inject, Injectable, signal } from '@angular/core';
import { ConnectionStatus, FightWsService } from './fight-ws.service';
import { FightPhase, FightPokemonState, FightState, TurnEvent } from './fight.model';
import { TeamService } from '../team/team.service';
import { TeamSlot } from '../team/team.model';

const OPPONENT_TEAM: FightPokemonState[] = [
  {
    slotIndex: 0, pokedexId: 9, name: 'Tortank',
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/9.png',
    spriteBack: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/9.png',
    types: ['water'], hp: 79, hpMax: 79, isFainted: false,
  },
  {
    slotIndex: 1, pokedexId: 3, name: 'Florizarre',
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/3.png',
    spriteBack: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/3.png',
    types: ['grass', 'poison'], hp: 80, hpMax: 80, isFainted: false,
  },
  {
    slotIndex: 2, pokedexId: 6, name: 'Dracaufeu',
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png',
    spriteBack: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/6.png',
    types: ['fire', 'flying'], hp: 78, hpMax: 78, isFainted: false,
  },
];

function slotToFightPokemon(slot: TeamSlot): FightPokemonState {
  return {
    slotIndex: slot.slotIndex,
    pokedexId: slot.pokedexId,
    name: slot.name,
    sprite: slot.sprite,
    spriteBack: slot.spriteBack,
    types: slot.types,
    hp: slot.hpMax,
    hpMax: slot.hpMax,
    isFainted: false,
  };
}

@Injectable()
export class FightWsMockService extends FightWsService {
  private readonly teamService = inject(TeamService);

  private readonly _phase = signal<FightPhase | null>(null);
  private readonly _playerActivePokemon = signal<FightPokemonState | null>(null);
  private readonly _opponentActivePokemon = signal<FightPokemonState | null>(null);
  private readonly _playerTeam = signal<FightPokemonState[]>([]);
  private readonly _playerHasActed = signal<boolean>(false);
  private readonly _mustSwitch = signal<boolean>(false);
  private readonly _log = signal<TurnEvent[]>([]);
  private readonly _winner = signal<string | null>(null);
  private readonly _isFinished = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _connectionStatus = signal<ConnectionStatus>('connecting');
  private readonly _opponentName = signal<string>('');
  private readonly _playerName = signal<string>('');
  private readonly _opponentRemainingCount = signal<number>(0);
  private readonly _isPendingAction = signal<boolean>(false);

  readonly phase = this._phase.asReadonly();
  readonly playerActivePokemon = this._playerActivePokemon.asReadonly();
  readonly opponentActivePokemon = this._opponentActivePokemon.asReadonly();
  readonly playerTeam = this._playerTeam.asReadonly();
  readonly playerHasActed = this._playerHasActed.asReadonly();
  readonly mustSwitch = this._mustSwitch.asReadonly();
  readonly log = this._log.asReadonly();
  readonly winner = this._winner.asReadonly();
  readonly isFinished = this._isFinished.asReadonly();
  readonly error = this._error.asReadonly();
  readonly connectionStatus = this._connectionStatus.asReadonly();
  readonly opponentName = this._opponentName.asReadonly();
  readonly playerName = this._playerName.asReadonly();
  readonly opponentRemainingCount = this._opponentRemainingCount.asReadonly();
  readonly isPendingAction = this._isPendingAction.asReadonly();

  private state!: FightState;
  private connectedGameId: number | null = null;
  private timers: ReturnType<typeof setTimeout>[] = [];

  connect(gameId: number): void {
    this.connectedGameId = gameId;
    this._connectionStatus.set('connecting');
    this.clearTimers();

    this.schedule(() => {
      this._connectionStatus.set('waiting_opponent');
    }, 500);

    this.schedule(() => {
      this.state = this.buildBaseState();
      this.applyState(this.state);
      this._connectionStatus.set('in_fight');
    }, 1500);
  }

  isConnected(gameId: number): boolean {
    return this.connectedGameId === gameId;
  }

  sendAttack(moveSlot: number, _pokemonSlot: number): void {
    this._isPendingAction.set(true);

    this.schedule(() => {
      const damage = 15 + Math.floor(Math.random() * 20);
      const opponentHp = Math.max(0, this.state.opponentActivePokemon.hp - damage);
      const nextTurn = this.state.turnNumber + 1;
      const playerPokemonName = this.state.playerActivePokemon.name;
      const moveName = this.teamService.slots()[this.state.playerActivePokemon.slotIndex]
        ?.moves[moveSlot]?.frenchName ?? `Attaque ${moveSlot + 1}`;

      const turnLog: TurnEvent[] = [
        { turn: nextTurn, type: 'turn_start', message: `Tour ${nextTurn}` },
        { turn: nextTurn, type: 'attack', message: `${playerPokemonName} utilise ${moveName} !` },
        { turn: nextTurn, type: 'damage', message: `${this.state.opponentActivePokemon.name} perd ${damage} PV.` },
      ];

      const finished = opponentHp === 0;
      if (finished) {
        turnLog.push({ turn: nextTurn, type: 'faint', message: `${this.state.opponentActivePokemon.name} est K.O. !` });
      }

      const newLog = [...this.state.log, ...turnLog];

      this.state = {
        ...this.state,
        turnNumber: nextTurn,
        phase: finished ? 'finished' : 'waiting_actions',
        playerHasActed: false,
        opponentActivePokemon: { ...this.state.opponentActivePokemon, hp: opponentHp, isFainted: finished },
        opponentRemainingCount: finished ? 0 : this.state.opponentRemainingCount,
        log: finished ? [...newLog, { turn: nextTurn, type: 'fight_end', message: 'Joueur remporte le combat !' }] : newLog,
        winner: finished ? 'Joueur' : null,
      };

      this.applyState(this.state);
      this._isPendingAction.set(false);
    }, 800);
  }

  sendSwitch(slotIndex: number): void {
    this._isPendingAction.set(true);

    this.schedule(() => {
      const incomingSlot = this.teamService.slots()[slotIndex];
      const incoming: FightPokemonState = incomingSlot
        ? { ...slotToFightPokemon(incomingSlot), hp: this.state.playerTeam.find(p => p.slotIndex === slotIndex)?.hp ?? incomingSlot.hpMax }
        : this.state.playerActivePokemon;

      const updatedTeam = this.state.playerTeam.map(p =>
        p.slotIndex === slotIndex ? incoming : p,
      );

      const switchLog: TurnEvent[] = [
        ...this.state.log,
        { turn: this.state.turnNumber, type: 'switch', message: `Joueur envoie ${incoming.name} !` },
      ];

      this.state = {
        ...this.state,
        mustSwitch: false,
        playerHasActed: false,
        playerActivePokemon: incoming,
        playerTeam: updatedTeam,
        log: switchLog,
      };
      this.applyState(this.state);
      this._isPendingAction.set(false);
    }, 500);
  }

  reset(): void {
    this.clearTimers();
    this.connectedGameId = null;
    this._phase.set(null);
    this._playerActivePokemon.set(null);
    this._opponentActivePokemon.set(null);
    this._playerTeam.set([]);
    this._playerHasActed.set(false);
    this._mustSwitch.set(false);
    this._log.set([]);
    this._winner.set(null);
    this._isFinished.set(false);
    this._error.set(null);
    this._connectionStatus.set('connecting');
    this._opponentName.set('');
    this._playerName.set('');
    this._opponentRemainingCount.set(0);
    this._isPendingAction.set(false);
  }

  private buildBaseState(): FightState {
    const slots = this.teamService.slots();
    const firstIndex = this.teamService.firstPokemon();
    const playerTeam = slots
      .filter((s): s is TeamSlot => s !== null)
      .map(slotToFightPokemon);
    const active = playerTeam.find(p => p.slotIndex === firstIndex) ?? playerTeam[0];

    const opponentTeam = OPPONENT_TEAM.map(p => ({ ...p }));
    const opponentActive = opponentTeam[0];

    return {
      gameId: 1,
      turnNumber: 1,
      phase: 'waiting_actions',
      playerName: 'Joueur',
      playerActivePokemon: active,
      playerTeam,
      opponentName: 'Adversaire',
      opponentActivePokemon: opponentActive,
      opponentRemainingCount: opponentTeam.length,
      playerHasActed: false,
      log: [{ turn: 1, type: 'turn_start', message: 'Tour 1' }],
      winner: null,
      mustSwitch: false,
    };
  }

  private applyState(state: FightState): void {
    this._phase.set(state.phase);
    this._playerActivePokemon.set(state.playerActivePokemon);
    this._opponentActivePokemon.set(state.opponentActivePokemon);
    this._playerTeam.set(state.playerTeam);
    this._playerHasActed.set(state.playerHasActed);
    this._mustSwitch.set(state.mustSwitch);
    this._log.set(state.log);
    this._winner.set(state.winner);
    this._isFinished.set(state.phase === 'finished');
    this._opponentName.set(state.opponentName);
    this._playerName.set(state.playerName);
    this._opponentRemainingCount.set(state.opponentRemainingCount);
  }

  private schedule(fn: () => void, delay: number): void {
    this.timers.push(setTimeout(fn, delay));
  }

  private clearTimers(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }
}
