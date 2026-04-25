import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { HistoryService } from './history.service';
import { GameHistoryEntry, GameResult } from './history.model';

const apiResp = <T>(data: T) => ({ code: '200', message: 'OK', data });

const mockHistoryEntry: GameHistoryEntry = {
  id: 1,
  date: '2025-01-01T10:00:00',
  opponentName: 'Rival',
  result: 'win' as GameResult,
  turnCount: 5,
  playerTeam: [
    {
      pokedexId: 25,
      name: 'Pikachu',
      sprite: 'https://example.com/pikachu.png',
      isFainted: false,
    },
  ],
  opponentTeam: [
    {
      pokedexId: 4,
      name: 'Charmander',
      sprite: 'https://example.com/charmander.png',
      isFainted: true,
    },
  ],
  log: [],
};

const mockHistoryEntry2: GameHistoryEntry = {
  id: 2,
  date: '2025-01-02T15:00:00',
  opponentName: 'Trainer',
  result: 'loss' as GameResult,
  turnCount: 8,
  playerTeam: [
    {
      pokedexId: 1,
      name: 'Bulbasaur',
      sprite: 'https://example.com/bulbasaur.png',
      isFainted: true,
    },
  ],
  opponentTeam: [
    {
      pokedexId: 7,
      name: 'Squirtle',
      sprite: 'https://example.com/squirtle.png',
      isFainted: false,
    },
  ],
  log: [],
};

describe('HistoryService', () => {
  let service: HistoryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HistoryService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(HistoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('Initial state', () => {
    it('history signal is empty array', () => {
      expect(service.history()).toEqual([]);
    });

    it('isLoading signal is false', () => {
      expect(service.isLoading()).toBe(false);
    });

    it('error signal is null', () => {
      expect(service.error()).toBeNull();
    });
  });

  describe('loadHistory()', () => {
    it('sends GET request to /games/history', () => {
      service.loadHistory().subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/games/history'));
      expect(req.request.method).toBe('GET');
      req.flush(apiResp([]));
    });

    it('sets isLoading to true before request completes', () => {
      const sub = service.loadHistory().subscribe();

      expect(service.isLoading()).toBe(true);

      const req = httpMock.expectOne(r => r.url.includes('/games/history'));
      req.flush(apiResp([]));

      sub.unsubscribe();
    });

    it('populates history signal with response data', () => {
      service.loadHistory().subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/games/history'));
      req.flush(apiResp([mockHistoryEntry]));

      expect(service.history()).toEqual([mockHistoryEntry]);
    });

    it('sets isLoading to false after successful load', () => {
      service.loadHistory().subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/games/history'));
      req.flush(apiResp([mockHistoryEntry]));

      expect(service.isLoading()).toBe(false);
    });

    it('handles empty history array', () => {
      service.loadHistory().subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/games/history'));
      req.flush(apiResp([]));

      expect(service.history()).toEqual([]);
      expect(service.error()).toBeNull();
      expect(service.isLoading()).toBe(false);
    });

    it('handles multiple history entries', () => {
      service.loadHistory().subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/games/history'));
      req.flush(apiResp([mockHistoryEntry, mockHistoryEntry2]));

      expect(service.history().length).toBe(2);
      expect(service.history()[0]).toEqual(mockHistoryEntry);
      expect(service.history()[1]).toEqual(mockHistoryEntry2);
    });

    it('sets error signal on HTTP 500', () => {
      service.loadHistory().subscribe({
        next: () => {},
        error: () => {},
      });

      const req = httpMock.expectOne(r => r.url.includes('/games/history'));
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(service.error()).toBe("Impossible de charger l'historique");
    });

    it('sets isLoading to false on HTTP error', () => {
      service.loadHistory().subscribe({
        next: () => {},
        error: () => {},
      });

      const req = httpMock.expectOne(r => r.url.includes('/games/history'));
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(service.isLoading()).toBe(false);
    });

    it('sets error signal on 401 Unauthorized', () => {
      service.loadHistory().subscribe({
        next: () => {},
        error: () => {},
      });

      const req = httpMock.expectOne(r => r.url.includes('/games/history'));
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(service.error()).toBe("Impossible de charger l'historique");
    });

    it('clears error on successful load after prior error', () => {
      // First load with error
      service.loadHistory().subscribe({
        next: () => {},
        error: () => {},
      });

      const req1 = httpMock.expectOne(r => r.url.includes('/games/history'));
      req1.flush(null, { status: 500, statusText: 'Internal Server Error' });
      expect(service.error()).toBe("Impossible de charger l'historique");

      // Second load successful
      service.loadHistory().subscribe();

      const req2 = httpMock.expectOne(r => r.url.includes('/games/history'));
      req2.flush(apiResp([mockHistoryEntry]));

      expect(service.history()).toEqual([mockHistoryEntry]);
      expect(service.error()).toBeNull();
      expect(service.isLoading()).toBe(false);
    });

    it('returns an Observable that can be subscribed to', async () => {
      const observable = service.loadHistory();
      expect(observable).toBeDefined();

      const dataPromise = new Promise((resolve) => {
        observable.subscribe({
          next: (data) => {
            expect(data).toEqual([mockHistoryEntry]);
            resolve(data);
          },
        });
      });

      const req = httpMock.expectOne(r => r.url.includes('/games/history'));
      req.flush(apiResp([mockHistoryEntry]));

      await dataPromise;
    });

    it('does not clear history on error', () => {
      // Load initial history
      service.loadHistory().subscribe();
      const req1 = httpMock.expectOne(r => r.url.includes('/games/history'));
      req1.flush(apiResp([mockHistoryEntry]));
      expect(service.history()).toEqual([mockHistoryEntry]);

      // Load with error
      service.loadHistory().subscribe({
        next: () => {},
        error: () => {},
      });
      const req2 = httpMock.expectOne(r => r.url.includes('/games/history'));
      req2.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(service.history()).toEqual([mockHistoryEntry]);
    });
  });
});
