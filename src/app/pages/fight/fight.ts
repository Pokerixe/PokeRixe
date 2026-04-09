import { Component, computed, effect, inject, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Move } from '../../shared/components/move/move';
import { FightLog } from '../../shared/components/fight-log/fight-log';
import { FightPokemonCard } from '../../shared/components/fight-pokemon-card/fight-pokemon-card';
import { HpBar } from '../../shared/components/hp-bar/hp-bar';
import { FightService } from '../../core/fight/fight.service';
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
  private readonly fightService = inject(FightService);
  private readonly teamService = inject(TeamService);
  private readonly route = inject(ActivatedRoute);

  /** Identifiant de la partie en cours, lu depuis l'URL. */
  private readonly gameId = Number(this.route.snapshot.paramMap.get('gameId'));

  // ─── Signaux du FightService exposés au template ──────────────────────────

  readonly phase = this.fightService.phase;
  readonly playerActive = this.fightService.playerActivePokemon;
  readonly opponentActive = this.fightService.opponentActivePokemon;
  readonly playerTeam = this.fightService.playerTeam;
  readonly opponentName = this.fightService.opponentName;
  readonly playerName = this.fightService.playerName;
  readonly playerHasActed = this.fightService.playerHasActed;
  readonly mustSwitch = this.fightService.mustSwitch;
  readonly log = this.fightService.log;
  readonly winner = this.fightService.winner;
  readonly isFinished = this.fightService.isFinished;
  readonly error = this.fightService.error;

  // ─── Tracking des Pokémon adverses vus ────────────────────────────────────

  /** Liste des Pokémon adverses déjà rencontrés (découverts quand ils entrent en combat). */
  readonly seenOpponents = signal<FightPokemonState[]>([]);

  /** Nombre total de Pokémon adverses (vus + non vus encore vivants). */
  readonly opponentTotalCount = computed(() => {
    const remaining = this.fightService.opponentRemainingCount();
    const faintedSeen = this.seenOpponents().filter((p) => p.isFainted).length;
    return remaining + faintedSeen;
  });

  /** Nombre de Pokémon adverses pas encore découverts. */
  readonly unseenOpponentCount = computed(() => {
    return Math.max(0, this.opponentTotalCount() - this.seenOpponents().length);
  });

  constructor() {
    this.fightService.startPolling(this.gameId);

    // Chaque fois que le Pokémon actif adverse change, on l'ajoute aux vus
    effect(() => {
      const active = this.opponentActive();
      if (!active) return;
      this.seenOpponents.update((seen) => {
        const existing = seen.findIndex((p) => p.slotIndex === active.slotIndex);
        if (existing >= 0) {
          // Met à jour l'état (hp, isFainted) du Pokémon déjà vu
          const updated = [...seen];
          updated[existing] = active;
          return updated;
        }
        return [...seen, active];
      });
    });
  }

  ngOnDestroy(): void {
    this.fightService.reset();
  }

  // ─── Signaux calculés ────────────────────────────────────────────────────

  readonly activePlayerMoves = computed<TeamMove[]>(() => {
    const activeSlotIndex = this.playerActive()?.slotIndex;
    if (activeSlotIndex == null) return [];
    return this.teamService.slots()[activeSlotIndex]?.moves ?? [];
  });

  readonly canAct = computed(
    () => !this.playerHasActed() && this.phase() === 'waiting_actions',
  );

  // ─── Actions ─────────────────────────────────────────────────────────────

  onMoveClick(move: TeamMove): void {
    if (!this.canAct()) return;
    const activeSlotIndex = this.playerActive()?.slotIndex;
    if (activeSlotIndex == null) return;
    const slot = this.teamService.slots()[activeSlotIndex];
    if (!slot) return;
    this.fightService.sendAttack(this.gameId, move, slot.stats, slot.types).subscribe();
  }

  onPokemonSwitch(slotIndex: number): void {
    const target = this.playerTeam().find((p) => p.slotIndex === slotIndex);
    if (!target || target.isFainted) return;
    if (target.slotIndex === this.playerActive()?.slotIndex) return;
    if (!this.mustSwitch() && !this.canAct()) return;
    this.fightService.sendSwitch(this.gameId, slotIndex).subscribe();
  }
}
