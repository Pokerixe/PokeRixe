import { Injectable, signal } from '@angular/core';
import { encode, decode } from '@msgpack/msgpack';
import { ConnectionStatus, FightWsService } from './fight-ws.service';
import { FightPhase, FightPokemonState, FightState, TurnEvent } from './fight.model';
import {Message, Packet, PacketMap} from './fight-ws.model';
import {environment} from '../../../environments/environment';

@Injectable()
export class FightWsServiceImpl extends FightWsService {

  private readonly BASE = environment.apiUrl;

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
  private userId: string | null = null;

  // Reconnection TODO
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT = 3;

  private getToken(): string {
    return localStorage.getItem('fightToken') ?? '';
  }

  connect(userId: string): void {
    this.userId = userId;
    this.reconnectAttempts = 0;
    this._connectionStatus.set('connecting');
    this.openSocket();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  sendPacket<T extends keyof PacketMap>(type: T, data: PacketMap[T]): void {
    const msg: Packet<T, PacketMap[T]> = {
      token: this.getToken(),
      type,
      data
    };

    this.ws?.send(encode(msg));
  }

  sendJoin(): void {
    console.log("Sending join message")
    if (this.userId == null) return
    this.sendPacket('JoinPacket', { userId:  this.userId});
  }

  sendAttack(moveSlot: number, pokemonSlot: number): void {
    this._isPendingAction.set(true);

    this.sendPacket('AttackPacket', { moveSlot, pokemonSlot });
  }

  sendSwitch(slotIndex: number): void {
    this._isPendingAction.set(true);

    this.sendPacket('SwitchPacket', { switchToSlotIndex: slotIndex });
  }

  reset(): void {
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      this.ws.close(1000);
    }
    this.ws = null;
    localStorage.removeItem('fightToken');
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

  private openSocket(): void {
    const protocol = this.BASE.startsWith('https') ? 'wss' : 'ws';
    const url = `${protocol}://${this.BASE.replace(/^https?:\/\//, '')}ws`;
    const ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';
    this.ws = ws;


    ws.onopen = () => {
      console.log("WS connected");
      this._connectionStatus.set('waiting');

      /*
       * Le protocole demande à ce que chaque client qui rejoint le websocket, doit envoyer un JoinPacket avec son token
       * pour le faire rejoindre une partie.
       *
       * Le websocket est partagé entre tout le monde mais ce qui identifie les joueurs c'est le token qui est donné par le serveur
       */
      this.sendJoin();
    };

    ws.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      try {
        const message = decode(event.data) as Message;
        this.handleMessage(message);
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
        break;
      case 'JoinPacket':
        const joinUserId = msg.data.userId;
        if (joinUserId === this.userId) return;

        /*
         * Un utilisateur vient de rejoindre la partie, on en déduit que c'est le joueur numéro 2
         */
        this._opponentName.set(`Joueur ${joinUserId}`); // TODO

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
    // this._isPendingAction.set(false); FIXME
    // if (this.reconnectAttempts < this.MAX_RECONNECT && this.token !== null) {
    //   const delay = Math.pow(2, this.reconnectAttempts) * 1000;
    //   this.reconnectAttempts++;
    //   setTimeout(() => {
    //     if (this.token !== null) {
    //       this.openSocket(this.token);
    //     }
    //   }, delay);
    // } else {
    //   this._connectionStatus.set('disconnected');
    // }
  }
}
