import { Injectable, signal } from '@angular/core';
import { encode, decode } from '@msgpack/msgpack';
import { ConnectionStatus, FightWsService } from './fight-ws.service';
import { FightPhase, FightPokemonState, FightState, TurnEvent } from './fight.model';
import { Message } from './fight-ws.model';

@Injectable()
export class FightWsServiceImpl extends FightWsService {
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

  private ws: WebSocket | null = null;
  private currentGameId: number | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT = 3;

  private getToken(): string {
    return localStorage.getItem('fight_token') ?? '';
  }

  connect(gameId: number): void {
    this.currentGameId = gameId;
    this.reconnectAttempts = 0;
    this._connectionStatus.set('connecting');
    this.openSocket(gameId);
  }

  isConnected(gameId: number): boolean {
    return this.currentGameId === gameId && this.ws?.readyState === WebSocket.OPEN;
  }

  sendAttack(moveSlot: number, pokemonSlot: number): void {
    this._isPendingAction.set(true);

    const msg: Extract<Message, { type: 'AttackPacket' }> = {
      token: this.getToken(),
      type: 'AttackPacket',
      data: { moveSlot, pokemonSlot }
    };

    this.ws?.send(encode(msg));
  }

  sendSwitch(slotIndex: number): void {
    this._isPendingAction.set(true);

    const msg: Extract<Message, { type: 'SwitchPacket' }> = {
      token: this.getToken(),
      type: 'SwitchPacket',
      data: { switchToSlotIndex: slotIndex }
    };

    this.ws?.send(encode(msg));
  }

  reset(): void {
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      this.ws.close(1000);
    }
    this.ws = null;
    this.currentGameId = null;
    this.reconnectAttempts = 0;
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

  private openSocket(gameId: number): void {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${protocol}://${window.location.host}/api/ws`;
    const ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';
    this.ws = ws;

    ws.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      try {
        const msg = decode(event.data) as Message;
        this.handleMessage(msg);
      } catch {
        this._error.set('Message serveur invalide');
      }
    };

    ws.onclose = (event: CloseEvent) => {
      if (event.code === 1000) {
        this.reset();
      } else {
        this.handleUnexpectedClose();
      }
    };

    ws.onerror = () => {
      this._error.set('Erreur de connexion WebSocket');
    };
  }

  private handleMessage(msg: Message): void {
    switch (msg.type) {
      case 'WaitingOpponentPacket':
        this._connectionStatus.set('waiting');
        break;

      case 'FullStatePacket':
        this.applyState(msg.data);
        this._connectionStatus.set('playing');
        this._isPendingAction.set(false);
        break;

      case 'ErrorPacket':
        this._error.set(msg.data.message);
        this._isPendingAction.set(false);
        break;

      case 'AttackPacket':
      case 'SwitchPacket':
      case 'JoinPacket':
        // TODO : Handle
        break;

      default: {
        const _exhaustiveCheck: never = msg;
        console.warn('Unhandled packet', _exhaustiveCheck);
      }
    }
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

  private handleUnexpectedClose(): void {
    this._isPendingAction.set(false);
    if (this.reconnectAttempts < this.MAX_RECONNECT && this.currentGameId !== null) {
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      this.reconnectAttempts++;
      setTimeout(() => {
        if (this.currentGameId !== null) {
          this.openSocket(this.currentGameId);
        }
      }, delay);
    } else {
      this._connectionStatus.set('disconnected');
    }
  }
}
