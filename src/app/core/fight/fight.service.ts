import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Observable, Subscription, timer } from 'rxjs';
import { catchError, map, switchMap, takeWhile, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';
import { PokemonStats } from '../../shared/models/pokemon-stats.model';
import { TeamMove } from '../team/team.model';
import {
  FightAction,
  FightActionResponse,
  FightPhase,
  FightPokemonState,
  FightState,
  TurnEvent,
} from './fight.model';

/**
 * Service gérant la logique du combat JCJ (Joueur contre Joueur).
 *
 * Utilise le Short Polling HTTP pour synchroniser l'état du combat :
 * un `GET /games/:id/state` est envoyé toutes les 1,5 secondes.
 * Les actions du joueur (attaque ou switch) sont envoyées via `POST /games/:id/action`.
 *
 * @remarks
 * Ce service est conçu pour être utilisé avec `startPolling()` à l'entrée sur la page de combat
 * et `reset()` dans `ngOnDestroy()` pour libérer les ressources.
 */
@Injectable({ providedIn: 'root' })
export class FightService {
  private readonly http = inject(HttpClient);
  private readonly BASE = environment.apiUrl;

  // ─── Signaux privés ──────────────────────────────────────────────────────────
  private readonly _fightState = signal<FightState | null>(null);
  private readonly _isPolling = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  private pollingSubscription: Subscription | null = null;

  // ─── Signaux publics (readonly) ───────────────────────────────────────────────

  /** Etat complet du combat, ou `null` si le polling n'a pas encore répondu. */
  readonly fightState = this._fightState.asReadonly();

  /** `true` si le polling est actif. */
  readonly isPolling = this._isPolling.asReadonly();

  /** Dernière erreur de communication, ou `null`. */
  readonly error = this._error.asReadonly();

  // ─── Signaux calculés ────────────────────────────────────────────────────────

  /** Phase courante du combat (`waiting_actions`, `waiting_switch` ou `finished`). */
  readonly phase = computed<FightPhase | null>(() => this._fightState()?.phase ?? null);

  /** Numéro du tour courant. */
  readonly turnNumber = computed(() => this._fightState()?.turnNumber ?? 0);

  /** Pokémon actif du joueur. */
  readonly playerActivePokemon = computed<FightPokemonState | null>(
    () => this._fightState()?.playerActivePokemon ?? null,
  );

  /** Pokémon actif de l'adversaire. */
  readonly opponentActivePokemon = computed<FightPokemonState | null>(
    () => this._fightState()?.opponentActivePokemon ?? null,
  );

  /** Équipe complète du joueur avec leur état courant (pour l'UI de switch). */
  readonly playerTeam = computed<FightPokemonState[]>(() => this._fightState()?.playerTeam ?? []);

  /** Nom de l'adversaire. */
  readonly opponentName = computed(() => this._fightState()?.opponentName ?? '');

  /** Nom du joueur courant. */
  readonly playerName = computed(() => this._fightState()?.playerName ?? '');

  /** `true` si le joueur a déjà soumis son action pour ce tour. */
  readonly playerHasActed = computed(() => this._fightState()?.playerHasActed ?? false);

  /** `true` si le joueur doit choisir un remplaçant (son Pokémon actif est K.O.). */
  readonly mustSwitch = computed(() => this._fightState()?.mustSwitch ?? false);

  /** Journal chronologique des événements de combat. */
  readonly log = computed<TurnEvent[]>(() => this._fightState()?.log ?? []);

  /** Nom du gagnant, ou `null` si le combat n'est pas terminé. */
  readonly winner = computed(() => this._fightState()?.winner ?? null);

  /** `true` si le combat est terminé. */
  readonly isFinished = computed(() => this._fightState()?.phase === 'finished');

  /** Nombre de Pokémon non-K.O. restants chez l'adversaire. */
  readonly opponentRemainingCount = computed(
    () => this._fightState()?.opponentRemainingCount ?? 0,
  );

  // ─── Méthodes ────────────────────────────────────────────────────────────────

  /**
   * Démarre le polling de l'état du combat toutes les 1,5 secondes.
   * Un premier appel est effectué immédiatement.
   * Le polling s'arrête automatiquement quand la phase passe à `finished`.
   *
   * @param gameId Identifiant de la partie à suivre
   */
  startPolling(gameId: number): void {
    this.stopPolling();
    this._isPolling.set(true);
    this._error.set(null);

    this.pollingSubscription = timer(0, 1500)
      .pipe(
        switchMap(() =>
          this.http
            .get<ApiResponse<FightState>>(`${this.BASE}games/${gameId}/state`)
            .pipe(
              map((r) => r.data),
              catchError(() => {
                this._error.set('Erreur de connexion au combat');
                return EMPTY;
              }),
            ),
        ),
        takeWhile((state) => state.phase !== 'finished', true),
      )
      .subscribe({
        next: (state) => this._fightState.set(state),
        complete: () => this._isPolling.set(false),
      });
  }

  /**
   * Arrête le polling de l'état du combat et libère la souscription.
   */
  stopPolling(): void {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = null;
    this._isPolling.set(false);
  }

  /**
   * Envoie une action d'attaque au serveur.
   * Inclut les données complètes du move et les stats de l'attaquant pour
   * que le serveur puisse effectuer le calcul des dégâts.
   *
   * @param gameId Identifiant de la partie
   * @param move L'attaque choisie par le joueur
   * @param attackerStats Stats du Pokémon attaquant
   * @param attackerTypes Types du Pokémon attaquant
   * @returns Observable de la réponse du serveur
   */
  sendAttack(
    gameId: number,
    move: TeamMove,
    attackerStats: PokemonStats,
    attackerTypes: string[],
  ): Observable<FightActionResponse> {
    const action: FightAction = {
      type: 'attack',
      attack: {
        moveSlot: move.slot,
        moveName: move.name,
        moveType: move.type,
        movePower: move.power,
        moveAccuracy: move.accuracy,
        moveDamageClass: move.damageClass,
        attackerStats,
        attackerTypes,
      },
    };
    return this.http
      .post<ApiResponse<FightActionResponse>>(`${this.BASE}games/${gameId}/action`, action)
      .pipe(
        map((r) => r.data),
        tap((resp) => {
          if (!resp.accepted) this._error.set(resp.reason ?? 'Action refusée');
        }),
      );
  }

  /**
   * Envoie une action de switch au serveur.
   *
   * @param gameId Identifiant de la partie
   * @param slotIndex Index du Pokémon remplaçant dans l'équipe (0-5)
   * @returns Observable de la réponse du serveur
   */
  sendSwitch(gameId: number, slotIndex: number): Observable<FightActionResponse> {
    const action: FightAction = {
      type: 'switch',
      switch: { switchToSlotIndex: slotIndex },
    };
    return this.http
      .post<ApiResponse<FightActionResponse>>(`${this.BASE}games/${gameId}/action`, action)
      .pipe(
        map((r) => r.data),
        tap((resp) => {
          if (!resp.accepted) this._error.set(resp.reason ?? 'Action refusée');
        }),
      );
  }

  /**
   * Réinitialise l'état du combat et arrête le polling.
   * À appeler dans `ngOnDestroy()` de la page de combat.
   */
  reset(): void {
    this.stopPolling();
    this._fightState.set(null);
    this._error.set(null);
  }
}
