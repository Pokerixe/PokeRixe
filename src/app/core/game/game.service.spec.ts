import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { GameService } from './game.service';
import { Game, GameStatus } from './game.model';

const apiResp = <T>(data: T) => ({ code: '200', message: 'OK', data });

const mockGame: Game = {
  id: 1,
  player1: 'Ash',
  player2: null,
  description: 'Test game',
  nombrePokemon: 3,
  status: GameStatus.Waiting,
};

const mockGame2: Game = {
  id: 2,
  player1: 'Misty',
  player2: null,
  description: 'Water game',
  nombrePokemon: 6,
  status: GameStatus.Waiting,
};

describe('GameService', () => {
  let service: GameService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GameService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GameService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('loadGames()', () => {
    it('sends GET and populates games signal', () => {
      service.loadGames().subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/games') && r.method === 'GET');
      req.flush(apiResp([mockGame, mockGame2]));

      expect(service.games()).toEqual([mockGame, mockGame2]);
      expect(service.isLoading()).toBe(false);
    });

    it('sets isLoading to true while in-flight', () => {
      service.loadGames().subscribe();
      expect(service.isLoading()).toBe(true);

      httpMock.expectOne(r => r.url.includes('/games') && r.method === 'GET')
        .flush(apiResp([]));
    });

    it('sets isLoading to false on error', () => {
      service.loadGames().subscribe({ error: () => {} });

      httpMock.expectOne(r => r.url.includes('/games') && r.method === 'GET')
        .flush(null, { status: 500, statusText: 'Server Error' });

      expect(service.isLoading()).toBe(false);
    });
  });

  describe('createGame()', () => {
    it('sends POST with correct body and adds game to signal', () => {
      const dto = { description: 'New game', nombrePokemon: 3 };
      service.createGame(dto).subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/games') && r.method === 'POST');
      expect(req.request.body).toEqual(dto);
      req.flush(apiResp(mockGame));

      expect(service.games()).toContain(mockGame);
    });

    it('sets currentGame after create', () => {
      service.createGame({ description: 'Test', nombrePokemon: 1 }).subscribe();

      httpMock.expectOne(r => r.url.includes('/games') && r.method === 'POST')
        .flush(apiResp(mockGame));

      expect(service.currentGame()).toEqual(mockGame);
    });
  });

  describe('joinGame()', () => {
    it('sends POST to correct URL and updates games signal', () => {
      // Pre-populate games
      service.loadGames().subscribe();
      httpMock.expectOne(r => r.url.includes('/games') && r.method === 'GET')
        .flush(apiResp([mockGame, mockGame2]));

      const joined: Game = { ...mockGame, player2: 'Red', status: GameStatus.InProgress };
      service.joinGame(1).subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/games/1/join'));
      expect(req.request.method).toBe('POST');
      req.flush(apiResp(joined));

      expect(service.games().find(g => g.id === 1)).toEqual(joined);
      expect(service.currentGame()).toEqual(joined);
    });
  });

  describe('leaveGame()', () => {
    it('sends DELETE and removes game from signal', () => {
      // Pre-populate games and set currentGame
      service.loadGames().subscribe();
      httpMock.expectOne(r => r.url.includes('/games') && r.method === 'GET')
        .flush(apiResp([mockGame, mockGame2]));

      service.createGame({ description: 'Test', nombrePokemon: 1 }).subscribe();
      httpMock.expectOne(r => r.url.includes('/games') && r.method === 'POST')
        .flush(apiResp(mockGame));

      service.leaveGame();

      const req = httpMock.expectOne(r => r.url.includes(`/games/${mockGame.id}`) && r.method === 'DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });

      expect(service.games().find(g => g.id === mockGame.id)).toBeUndefined();
      expect(service.currentGame()).toBeNull();
    });

    it('does nothing when no currentGame', () => {
      service.leaveGame();
      httpMock.expectNone(r => r.method === 'DELETE');
    });
  });
});
