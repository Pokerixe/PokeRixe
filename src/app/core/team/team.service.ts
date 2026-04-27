import {computed, Injectable, signal} from '@angular/core';
import {Team, TeamMove, TeamSlot} from './team.model';
import {HttpClient} from '@angular/common/http';
import {Observable, forkJoin, map, of, switchMap, tap} from 'rxjs';
import {environment} from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';
import { MoveService } from '../../shared/services/move.service';

/**
 * Service de gestion de l'équipe Pokémon de l'utilisateur connecté.
 * Expose des signaux réactifs pour les slots, le premier Pokémon et l'état de sauvegarde.
 * Les mutations locales (setSlot, clearSlot, moveSlot…) sont immédiates ;
 * la persistance s'effectue explicitement via `saveTeam()`.
 */
@Injectable({providedIn: 'root'})
export class TeamService {

  private readonly BASE = environment.apiUrl;

  constructor(
    private readonly http: HttpClient,
    private readonly moveService: MoveService,
  ) {}

  private readonly _team = signal<Team>(this.emptyTeam());
  private readonly _isSaving = signal(false);

  /** Signal en lecture seule exposant l'intégralité de l'équipe. */
  readonly team = this._team.asReadonly();
  /** Signal calculé retournant le tableau des 6 slots (certains pouvant être `null`). */
  readonly slots = computed(() => this._team().slots);
  /** Signal calculé retournant l'index du Pokémon de tête (celui qui combat en premier). */
  readonly firstPokemon = computed(() => this._team().firstPokemon);
  /** Signal en lecture seule indiquant qu'une sauvegarde backend est en cours. */
  readonly isSaving = this._isSaving.asReadonly();

  /**
   * Charge la team de l'utilisateur depuis l'API, enrichit les moves avec leur nom français
   * via PokeAPI, puis met à jour le signal _team.
   */
  loadTeam(userId: string): Observable<Team> {
    return this.http.get<ApiResponse<Team>>(`${this.BASE}team`).pipe(
      map(r => r.data),
      switchMap(team => this.enrichTeamWithFrenchNames(team)),
      tap(team => this._team.set({...team, userId: team.userId ?? userId})),
    );
  }

  /**
   * Enrichit tous les TeamMove sans frenchName en appelant MoveService.getFrenchName.
   * Les résultats en cache sont réutilisés — aucun appel réseau superflu.
   */
  private enrichTeamWithFrenchNames(team: Team): Observable<Team> {
    const slotObservables = team.slots.map((slot): Observable<TeamSlot | null> => {
      if (!slot) return of(null);

      const moveObservables = slot.moves.map((move): Observable<TeamMove> => {
        if (!move.name || move.frenchName) return of(move);
        return this.moveService.getFrenchName(move.name).pipe(
          map(frenchName => ({...move, frenchName}))
        );
      });

      return forkJoin(moveObservables).pipe(
        map(moves => ({...slot, moves}))
      );
    });

    return forkJoin(slotObservables).pipe(
      map(slots => ({...team, slots}))
    );
  }

  /**
   * Persiste la team courante sur le backend via PUT /team.
   * Ré-enrichit les noms français après la réponse (le cache évite tout appel réseau superflu).
   */
  saveTeam(): void {
    this._isSaving.set(true);
    this.http.put<ApiResponse<Team>>(`${this.BASE}team`, this._team()).pipe(
      map(r => r.data),
      switchMap(team => this.enrichTeamWithFrenchNames(team)),
    ).subscribe({
      next: (team) => {
        this._team.set(team);
        this._isSaving.set(false);
      },
      error: (err) => {
        console.error('Failed to save team', err);
        this._isSaving.set(false);
      },
    });
  }

  /**
   * Définit le pokémon de tête (celui qui combat en premier).
   * Le slot cible doit être occupé.
   */
  setFirstPokemon(slotIndex: number): void {
    const slots = this._team().slots;
    if (slotIndex < 0 || slotIndex >= slots.length || slots[slotIndex] === null) {
      return;
    }
    this._team.update(team => ({...team, firstPokemon: slotIndex}));
  }

  /** Remplace le pokémon dans un slot. */
  setSlot(index: number, pokemon: TeamSlot): void {
    this._team.update(team => {
      const slots = [...team.slots];
      slots[index] = pokemon;
      return {...team, slots};
    });
  }

  /** Supprime le pokémon d'un slot (le passe à null). */
  clearSlot(index: number): void {
    this._team.update(team => {
      const slots = [...team.slots];
      slots[index] = null;
      // Si le slot supprimé était firstPokemon, on cherche le prochain slot occupé
      let firstPokemon = team.firstPokemon;
      if (firstPokemon === index) {
        firstPokemon = slots.findIndex(s => s !== null);
        if (firstPokemon === -1) firstPokemon = 0;
      }
      return {...team, slots, firstPokemon};
    });
  }

  /** Échange deux slots dans la team. */
  moveSlot(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) return;
    this._team.update(team => {
      const slots = [...team.slots];
      [slots[fromIndex], slots[toIndex]] = [slots[toIndex], slots[fromIndex]];
      // Met à jour firstPokemon si l'un des slots échangés était le premier
      let firstPokemon = team.firstPokemon;
      if (firstPokemon === fromIndex) firstPokemon = toIndex;
      else if (firstPokemon === toIndex) firstPokemon = fromIndex;
      return {...team, slots, firstPokemon};
    });
  }

  /** Remplace une attaque dans un slot. */
  setMove(slotIndex: number, moveIndex: number, move: TeamMove): void {
    this._team.update(team => {
      const slots = [...team.slots];
      const slot = slots[slotIndex];
      if (!slot) return team;

      const moves = [...slot.moves];
      moves[moveIndex] = move;
      slots[slotIndex] = {...slot, moves};
      return {...team, slots};
    });
  }

  /** Réinitialise une attaque à vide dans un slot. */
  clearMove(slotIndex: number, moveIndex: number): void {
    this.setMove(slotIndex, moveIndex, this.emptyMove(moveIndex as 0 | 1 | 2 | 3));
  }

  /** Réinitialise l'équipe à son état vide (6 slots `null`, firstPokemon à 0). Appelé lors du logout. */
  resetTeam(): void {
    this._team.set(this.emptyTeam());
  }

  private emptyTeam(): Team {
    return {
      userId: '',
      slots: Array(6).fill(null),
      firstPokemon: 0,
    };
  }

  private emptyMove(slot: 0 | 1 | 2 | 3): TeamMove {
    return {slot, name: '', frenchName: '', type: 'normal', power: null, accuracy: 100, damageClass: 'physical'};
  }
}
