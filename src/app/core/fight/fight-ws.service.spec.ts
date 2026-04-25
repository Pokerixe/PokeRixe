import { TestBed } from '@angular/core/testing';
import { encode } from '@msgpack/msgpack';
import { FightWsServiceImpl } from './fight-ws-impl.service';
import { FightPokemonState, FightState } from './fight.model';
import { FullStateMessage, ErrorMessage } from './fight-ws.model';

class MockWebSocket {
  static OPEN = 1;
  static CLOSED = 3;
  readyState = MockWebSocket.OPEN;
  binaryType = '';
  sentMessages: ArrayBuffer[] = [];

  onmessage: ((e: MessageEvent) => void) | null = null;
  onclose: ((e: CloseEvent) => void) | null = null;
  onerror: (() => void) | null = null;

  send(data: ArrayBuffer): void {
    this.sentMessages.push(data);
  }

  simulateMessage(payload: unknown): void {
    const encoded = encode(payload);
    const buffer = encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength);
    this.onmessage?.({ data: buffer } as MessageEvent);
  }

  simulateClose(code: number): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code } as CloseEvent);
  }

  close(code?: number): void {
    this.simulateClose(code ?? 1000);
  }
}

const mockPokemon: FightPokemonState = {
  slotIndex: 0, pokedexId: 6, name: 'Dracaufeu',
  sprite: '', spriteBack: '', types: ['fire'],
  hp: 78, hpMax: 78, isFainted: false,
};

const mockState = (): FightState => ({
  gameId: 1, turnNumber: 1, phase: 'waiting_actions',
  playerName: 'Alice', playerActivePokemon: mockPokemon, playerTeam: [mockPokemon],
  opponentName: 'Bob', opponentActivePokemon: mockPokemon, opponentRemainingCount: 1,
  playerHasActed: false, log: [], winner: null, mustSwitch: false,
});

describe('FightWsServiceImpl', () => {
  let service: FightWsServiceImpl;
  let mockWs: MockWebSocket;

  beforeEach(() => {
    mockWs = new MockWebSocket();

    function MockWsCtor() { return mockWs; }
    MockWsCtor.OPEN = MockWebSocket.OPEN;
    MockWsCtor.CLOSED = MockWebSocket.CLOSED;
    vi.stubGlobal('WebSocket', MockWsCtor);

    TestBed.configureTestingModule({ providers: [FightWsServiceImpl] });
    service = TestBed.inject(FightWsServiceImpl);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('passe connectionStatus à connecting puis in_fight après full_state', () => {
    service.connect(1);
    expect(service.connectionStatus()).toBe('connecting');

    const msg: FullStateMessage = { type: 'full_state', payload: mockState() };
    mockWs.simulateMessage(msg);

    expect(service.connectionStatus()).toBe('in_fight');
  });

  it('applique correctement le FightState reçu via full_state', () => {
    service.connect(1);
    const state = mockState();
    mockWs.simulateMessage({ type: 'full_state', payload: state } as FullStateMessage);

    expect(service.phase()).toBe('waiting_actions');
    expect(service.playerName()).toBe('Alice');
    expect(service.opponentName()).toBe('Bob');
    expect(service.playerHasActed()).toBe(false);
  });

  it('isPendingAction passe à true sur sendAttack et false après full_state', () => {
    service.connect(1);
    mockWs.simulateMessage({ type: 'full_state', payload: mockState() } as FullStateMessage);

    service.sendAttack(0, 0);
    expect(service.isPendingAction()).toBe(true);

    mockWs.simulateMessage({ type: 'full_state', payload: mockState() } as FullStateMessage);
    expect(service.isPendingAction()).toBe(false);
  });

  it('isPendingAction repasse à false sur réception d\'un error', () => {
    service.connect(1);
    service.sendAttack(0, 0);
    expect(service.isPendingAction()).toBe(true);

    const err: ErrorMessage = { type: 'error', message: 'Action refusée' };
    mockWs.simulateMessage(err);

    expect(service.isPendingAction()).toBe(false);
    expect(service.error()).toBe('Action refusée');
  });

  it('passe connectionStatus à waiting_opponent après le message serveur', () => {
    service.connect(1);
    mockWs.simulateMessage({ type: 'waiting_opponent' });
    expect(service.connectionStatus()).toBe('waiting_opponent');
  });

  it('isConnected retourne true pour le bon gameId avec socket ouverte', () => {
    service.connect(42);
    expect(service.isConnected(42)).toBe(true);
    expect(service.isConnected(1)).toBe(false);
  });

  it('reset ferme la socket et remet tous les signals à leur valeur initiale', () => {
    service.connect(1);
    mockWs.simulateMessage({ type: 'full_state', payload: mockState() } as FullStateMessage);

    service.reset();

    expect(service.phase()).toBeNull();
    expect(service.playerName()).toBe('');
    expect(service.isPendingAction()).toBe(false);
    expect(service.connectionStatus()).toBe('connecting');
  });

  it('passe connectionStatus à disconnected après 3 tentatives de reconnexion', () => {
    vi.useFakeTimers();
    service.connect(1);

    // 3 retries (reconnectAttempts 0→1→2→3), puis une 4e fermeture qui déclenche disconnected
    for (let i = 0; i < 3; i++) {
      mockWs.simulateClose(1006);
      vi.runAllTimers();
    }
    mockWs.simulateClose(1006);

    expect(service.connectionStatus()).toBe('disconnected');
    vi.useRealTimers();
  });

  it('ne relance pas de reconnexion sur fermeture propre (code 1000)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connectSpy = vi.spyOn(service as any, 'openSocket');
    service.connect(1);
    connectSpy.mockClear();

    mockWs.simulateClose(1000);

    expect(connectSpy).not.toHaveBeenCalled();
  });
});
