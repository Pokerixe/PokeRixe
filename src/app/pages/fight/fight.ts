import { Component, computed, effect, inject, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Move } from '../../shared/components/move/move';
import { FightLog } from '../../shared/components/fight-log/fight-log';
import { FightPokemonCard } from '../../shared/components/fight-pokemon-card/fight-pokemon-card';
import { HpBar } from '../../shared/components/hp-bar/hp-bar';
import { FightWsService } from '../../core/fight/fight-ws.service';
import { TeamService } from '../../core/team/team.service';
import { TeamMove } from '../../core/team/team.model';
import { FightPokemonState } from '../../core/fight/fight.model';

@Component({
  selector: 'app-fight',
  imports: [Move, FightLog, FightPokemonCard, HpBar],
  templateUrl: './fight.html',
  styleUrl: './fight.css',
})
export class Fight implements OnDestroy {
  private readonly fightWsService = inject(FightWsService);
  private readonly teamService = inject(TeamService);
  private readonly route = inject(ActivatedRoute);

  readonly gameId = Number(this.route.snapshot.paramMap.get('gameId'));

  /** Signaux exposés au template  */
  readonly phase = this.fightWsService.phase;
  readonly playerActive = this.fightWsService.playerActivePokemon;
  readonly opponentActive = this.fightWsService.opponentActivePokemon;
  readonly playerTeam = this.fightWsService.playerTeam;
  readonly opponentName = this.fightWsService.opponentName;
  readonly playerName = this.fightWsService.playerName;
  readonly playerHasActed = this.fightWsService.playerHasActed;
  readonly mustSwitch = this.fightWsService.mustSwitch;
  readonly log = this.fightWsService.log;
  readonly winner = this.fightWsService.winner;
  readonly isFinished = this.fightWsService.isFinished;
  readonly error = this.fightWsService.error;
  readonly connectionStatus = this.fightWsService.connectionStatus;
  readonly isPendingAction = this.fightWsService.isPendingAction;

  /** Tracking des Pokémon adverses vus */
  readonly seenOpponents = signal<FightPokemonState[]>([]);

  readonly opponentTotalCount = computed(() => {
    const remaining = this.fightWsService.opponentRemainingCount();
    const faintedSeen = this.seenOpponents().filter((p) => p.isFainted).length;
    return remaining + faintedSeen;
  });

  readonly unseenOpponentCount = computed(() => {
    return Math.max(0, this.opponentTotalCount() - this.seenOpponents().length);
  });

  constructor() {
    if (!this.fightWsService.isConnected(this.gameId)) {
      this.fightWsService.connect(this.gameId);
    }

    effect(() => {
      const active = this.opponentActive();
      if (!active) return;
      this.seenOpponents.update((seen) => {
        const existing = seen.findIndex((p) => p.slotIndex === active.slotIndex);
        if (existing >= 0) {
          const updated = [...seen];
          updated[existing] = active;
          return updated;
        }
        return [...seen, active];
      });
    });
  }

  ngOnDestroy(): void {
    this.fightWsService.reset();
  }

  /** Signaux calculés */
  readonly activePlayerMoves = computed<TeamMove[]>(() => {
    const activeSlotIndex = this.playerActive()?.slotIndex;
    if (activeSlotIndex == null) return [];
    return this.teamService.slots()[activeSlotIndex]?.moves ?? [];
  });

  readonly canAct = computed(
    () => !this.playerHasActed() && this.phase() === 'waiting_actions' && !this.isPendingAction(),
  );

  /** Actions */
  retryConnect(): void {
    this.fightWsService.connect(this.gameId);
  }

  onMoveClick(move: TeamMove): void {
    if (!this.canAct()) return;
    const activeSlotIndex = this.playerActive()?.slotIndex;
    if (activeSlotIndex == null) return;
    this.fightWsService.sendAttack(move.slot, activeSlotIndex);
  }

  onPokemonSwitch(slotIndex: number): void {
    if (this.isPendingAction()) return;
    const target = this.playerTeam().find((p) => p.slotIndex === slotIndex);
    if (!target || target.isFainted) return;
    if (target.slotIndex === this.playerActive()?.slotIndex) return;
    if (!this.mustSwitch() && !this.canAct()) return;
    this.fightWsService.sendSwitch(slotIndex);
  }
}
