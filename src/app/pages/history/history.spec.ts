import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { HistoryPage } from './history';
import { HistoryService } from '../../core/history/history.service';
import { GameHistoryEntry } from '../../core/history/history.model';

const mkEntry = (id: number, result: 'win' | 'loss'): GameHistoryEntry => ({
  id,
  date: '2025-01-15T10:00:00',
  opponentName: `Rival${id}`,
  result,
  turnCount: 5,
  playerTeam: [],
  opponentTeam: [],
  log: [],
});

function buildSvc(entries: GameHistoryEntry[] = []) {
  const _history = signal<GameHistoryEntry[]>([]);
  return {
    _history,
    history: _history.asReadonly(),
    isLoading: signal(false),
    error: signal<string | null>(null),
    loadHistory: vi.fn().mockImplementation(() => {
      _history.set(entries);
      return of(entries);
    }),
  };
}

describe('HistoryPage', () => {
  let component: HistoryPage;
  let fixture: ComponentFixture<HistoryPage>;
  let svc: ReturnType<typeof buildSvc>;

  const mockObserverInstance = { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() };

  beforeEach(() => {
    function MockIntersectionObserver() { return mockObserverInstance; }
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  afterEach(() => vi.unstubAllGlobals());

  async function setup(entries: GameHistoryEntry[] = []) {
    svc = buildSvc(entries);
    await TestBed.configureTestingModule({
      imports: [HistoryPage],
      providers: [{ provide: HistoryService, useValue: svc }],
    }).compileComponents();
    fixture = TestBed.createComponent(HistoryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  describe('with empty history', () => {
    beforeEach(async () => { await setup([]); });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('calls loadHistory on construction', () => {
      expect(svc.loadHistory).toHaveBeenCalled();
    });

    it('selectedGame is null when history is empty', () => {
      expect(component.selectedGame()).toBeNull();
    });

    it('aiModalOpen starts as false', () => {
      expect(component.aiModalOpen()).toBe(false);
    });

    it('hasMore is false with empty history', () => {
      expect(component.hasMore()).toBe(false);
    });

    describe('openAiModal() / closeAiModal()', () => {
      it('opens the AI modal', () => {
        component.openAiModal();
        expect(component.aiModalOpen()).toBe(true);
      });

      it('closes the AI modal', () => {
        component.openAiModal();
        component.closeAiModal();
        expect(component.aiModalOpen()).toBe(false);
      });
    });

    describe('formatDate()', () => {
      it('formats an ISO date string to fr-FR format', () => {
        const result = component.formatDate('2025-01-15T10:00:00');
        expect(result).toContain('15');
        expect(result).toContain('2025');
      });
    });

    describe('ngOnDestroy()', () => {
      it('disconnects the IntersectionObserver', () => {
        const disconnect = vi.fn();
        (component as any).observer = { disconnect };
        component.ngOnDestroy();
        expect(disconnect).toHaveBeenCalled();
      });

      it('does not throw when observer is undefined', () => {
        (component as any).observer = undefined;
        expect(() => component.ngOnDestroy()).not.toThrow();
      });
    });
  });

  describe('with two entries', () => {
    let entries: GameHistoryEntry[];

    beforeEach(async () => {
      entries = [mkEntry(1, 'win'), mkEntry(2, 'loss')];
      await setup(entries);
    });

    it('selects the first entry after load', () => {
      expect(component.selectedGame()).toEqual(entries[0]);
    });

    it('selectGame updates the selected game', () => {
      component.selectGame(entries[1]);
      expect(component.selectedGame()).toEqual(entries[1]);
    });

    it('hasMore is false when total is less than PAGE_SIZE', () => {
      expect(component.hasMore()).toBe(false);
    });
  });

  describe('hasMore() — more entries than PAGE_SIZE', () => {
    it('is true when history has more than 4 entries', async () => {
      const entries = Array.from({ length: 6 }, (_, i) => mkEntry(i + 1, 'win'));
      await setup(entries);
      expect(component.hasMore()).toBe(true);
    });
  });

  describe('setFilter()', () => {
    beforeEach(async () => {
      await setup([mkEntry(1, 'win'), mkEntry(2, 'loss'), mkEntry(3, 'win')]);
    });

    it('filters to wins only', () => {
      component.setFilter('win');
      expect(component.filteredHistory().length).toBe(2);
      expect(component.filteredHistory().every(g => g.result === 'win')).toBe(true);
    });

    it('filters to losses only', () => {
      component.setFilter('loss');
      expect(component.filteredHistory().length).toBe(1);
      expect(component.filteredHistory()[0].result).toBe('loss');
    });

    it('shows all when filter is "all"', () => {
      component.setFilter('win');
      component.setFilter('all');
      expect(component.filteredHistory().length).toBe(3);
    });

    it('resets visibleCount to PAGE_SIZE (4)', () => {
      (component as any).visibleCount.set(20);
      component.setFilter('all');
      expect((component as any).visibleCount()).toBe(4);
    });

    it('selects the first filtered entry', () => {
      component.setFilter('loss');
      expect(component.selectedGame()?.id).toBe(2);
    });

    it('sets selectedGame to null when no entries match the filter', () => {
      svc._history.set([mkEntry(1, 'loss'), mkEntry(2, 'loss')]);
      component.setFilter('win');
      expect(component.selectedGame()).toBeNull();
    });
  });
});
