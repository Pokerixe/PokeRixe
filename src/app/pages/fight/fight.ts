import { Component, computed, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Move } from '../../shared/components/move/move';
import { FightLog } from '../../shared/components/fight-log/fight-log';
import { FightPokemonCard } from '../../shared/components/fight-pokemon-card/fight-pokemon-card';
import { HpBar } from '../../shared/components/hp-bar/hp-bar';
import { FightService } from '../../core/fight/fight.service';
import { TeamService } from '../../core/team/team.service';
import { TeamMove } from '../../core/team/team.model';

@Component({
  selector: 'app-fight',
  imports: [Move, FightLog, FightPokemonCard, HpBar],
  templateUrl: './fight.html',
  styleUrl: './fight.css',
})
/**
 * Page d'interface de combat JCJ (Joueur contre Joueur).
 *
 * Orchestre le combat en connectant le `FightService` à l'interface :
 * - Démarre le polling via `FightService.startPolling(gameId)` à l'initialisation
 * - Transmet les actions du joueur (attaque / switch) au service
 * - Expose des signaux calculés pour le template
 *
 * Le `gameId` est lu depuis le paramètre de route `fight/:gameId`.
 */
export class Fight implements OnDestroy {
  private readonly fightService = inject(FightService);
  private readonly teamService = inject(TeamService);
  private readonly route = inject(ActivatedRoute);

  /** Identifiant de la partie en cours, lu depuis l'URL. */
  private readonly gameId = Number(this.route.snapshot.paramMap.get('gameId'));

  // ─── Signaux du FightService exposés au template ──────────────────────────

  /** Phase courante du combat. */
  readonly phase = this.fightService.phase;
  /** Pokémon actif du joueur. */
  readonly playerActive = this.fightService.playerActivePokemon;
  /** Pokémon actif de l'adversaire. */
  readonly opponentActive = this.fightService.opponentActivePokemon;
  /** Équipe complète du joueur (pour l'UI de switch). */
  readonly playerTeam = this.fightService.playerTeam;
  /** Nom de l'adversaire. */
  readonly opponentName = this.fightService.opponentName;
  /** Nom du joueur. */
  readonly playerName = this.fightService.playerName;
  /** `true` si le joueur a déjà soumis son action ce tour. */
  readonly playerHasActed = this.fightService.playerHasActed;
  /** `true` si le joueur doit choisir un remplaçant après un KO. */
  readonly mustSwitch = this.fightService.mustSwitch;
  /** Journal de combat. */
  readonly log = this.fightService.log;
  /** Nom du gagnant (null si combat en cours). */
  readonly winner = this.fightService.winner;
  /** `true` si le combat est terminé. */
  readonly isFinished = this.fightService.isFinished;
  /** Dernière erreur de communication. */
  readonly error = this.fightService.error;

  // ─── Signaux calculés ────────────────────────────────────────────────────

  /**
   * Attaques du Pokémon actif du joueur, récupérées depuis le `TeamService`.
   * Le `FightState` ne les expose pas côté client pour éviter la triche.
   */
  readonly activePlayerMoves = computed<TeamMove[]>(() => {
    const activeSlotIndex = this.playerActive()?.slotIndex;
    if (activeSlotIndex == null) return [];
    return this.teamService.slots()[activeSlotIndex]?.moves ?? [];
  });

  /** `true` si le joueur peut actuellement choisir une attaque. */
  readonly canAct = computed(
    () => !this.playerHasActed() && this.phase() === 'waiting_actions',
  );

  constructor() {
    this.fightService.startPolling(this.gameId);
  }

  ngOnDestroy(): void {
    this.fightService.reset();
  }

  /**
   * Envoie une action d'attaque au serveur lorsque le joueur clique sur un move.
   * @param move L'attaque sélectionnée
   */
  onMoveClick(move: TeamMove): void {
    if (!this.canAct()) return;
    const activeSlotIndex = this.playerActive()?.slotIndex;
    if (activeSlotIndex == null) return;
    const slot = this.teamService.slots()[activeSlotIndex];
    if (!slot) return;
    this.fightService.sendAttack(this.gameId, move, slot.stats, slot.types).subscribe();
  }

  /**
   * Envoie une action de switch au serveur lorsque le joueur clique sur une carte Pokémon.
   * @param slotIndex Index du Pokémon remplaçant dans l'équipe
   */
  onPokemonSwitch(slotIndex: number): void {
    const target = this.playerTeam().find((p) => p.slotIndex === slotIndex);
    if (!target || target.isFainted) return;
    if (target.slotIndex === this.playerActive()?.slotIndex) return;
    if (!this.mustSwitch() && !this.canAct()) return;
    this.fightService.sendSwitch(this.gameId, slotIndex).subscribe();
  }
}
