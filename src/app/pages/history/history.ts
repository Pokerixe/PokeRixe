import { Component, computed, ElementRef, inject, OnDestroy, AfterViewInit, signal, ViewChild } from '@angular/core';
import { FightLog } from '../../shared/components/fight-log/fight-log';
import { HistoryService } from '../../core/history/history.service';
import { GameHistoryEntry } from '../../core/history/history.model';

const PAGE_SIZE = 4;

@Component({
  selector: 'app-history',
  imports: [FightLog],
  templateUrl: './history.html',
  styleUrl: './history.css',
})
export class HistoryPage implements AfterViewInit, OnDestroy {
  private readonly historyService = inject(HistoryService);

  readonly isLoading = this.historyService.isLoading;
  readonly error = this.historyService.error;

  readonly filterResult = signal<'all' | 'win' | 'loss'>('all');
  readonly visibleCount = signal<number>(PAGE_SIZE);
  readonly selectedGame = signal<GameHistoryEntry | null>(null);
  readonly aiModalOpen = signal(false);

  readonly filteredHistory = computed(() => {
    const filter = this.filterResult();
    const all = this.historyService.history();
    return filter === 'all' ? all : all.filter((g) => g.result === filter);
  });

  readonly visibleHistory = computed(() => this.filteredHistory().slice(0, this.visibleCount()));

  readonly hasMore = computed(() => this.visibleCount() < this.filteredHistory().length);

  @ViewChild('sentinel') private sentinelRef!: ElementRef<HTMLElement>;
  private observer?: IntersectionObserver;

  constructor() {
    this.historyService.loadHistory().subscribe(() => {
      const first = this.filteredHistory()[0];
      if (first) this.selectedGame.set(first);
    });
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && this.hasMore()) {
          this.visibleCount.update((n) => n + PAGE_SIZE);
        }
      },
      { threshold: 0.1 },
    );
    if (this.sentinelRef) {
      this.observer.observe(this.sentinelRef.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  selectGame(game: GameHistoryEntry): void {
    this.selectedGame.set(game);
  }

  setFilter(filter: 'all' | 'win' | 'loss'): void {
    this.filterResult.set(filter);
    this.visibleCount.set(PAGE_SIZE);
    this.selectedGame.set(this.filteredHistory()[0] ?? null);
  }

  openAiModal(): void {
    this.aiModalOpen.set(true);
  }

  closeAiModal(): void {
    this.aiModalOpen.set(false);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
