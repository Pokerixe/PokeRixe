import {computed, Injectable, signal} from '@angular/core';
import {Team, TeamMove, TeamSlot} from './team.model';
import {AttackDto, PokemonDto, TeamDto} from './team.dto';
import {HttpClient} from '@angular/common/http';
import {Observable, forkJoin, map, of, switchMap, tap} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ApiResponse} from '../../shared/models/api-response.model';
import {MoveService} from '../../shared/services/move.service';
import {PokemonService} from '../../shared/services/pokemon.service';

@Injectable({providedIn: 'root'})
export class TeamService {

  private readonly BASE = environment.apiUrl;

  constructor(
    private readonly http: HttpClient,
    private readonly moveService: MoveService,
    private readonly pokemonService: PokemonService,
  ) {}

  private readonly _team = signal<Team>(this.emptyTeam());
  private readonly _isSaving = signal(false);

  readonly team = this._team.asReadonly();
  readonly slots = computed(() => this._team().slots);
  readonly firstPokemon = computed(() => this._team().firstPokemon);
  readonly isSaving = this._isSaving.asReadonly();

  loadTeamFromUser(dto: TeamDto | undefined, userId: string): Observable<Team> {
    return this.loadTeamFromDto(dto ?? {pokemons: []}, userId).pipe(
      tap(team => this._team.set(team)),
    );
  }

  saveTeam(): void {
    this._isSaving.set(true);
    this.http.patch<TeamDto>(`${this.BASE}users/team`, this.toTeamDto(this._team())).subscribe({
      next: () => {
        this._isSaving.set(false);
      },
      error: (err) => {
        console.error('Failed to save team', err);
        this._isSaving.set(false);
      },
    });
  }

  setFirstPokemon(slotIndex: number): void {
    const slots = this._team().slots;
    if (slotIndex < 0 || slotIndex >= slots.length || slots[slotIndex] === null) {
      return;
    }
    this._team.update(team => ({...team, firstPokemon: slotIndex}));
  }

  setSlot(index: number, pokemon: TeamSlot): void {
    this._team.update(team => {
      const slots = [...team.slots];
      slots[index] = pokemon;
      return {...team, slots};
    });
  }

  clearSlot(index: number): void {
    this._team.update(team => {
      const slots = [...team.slots];
      slots[index] = null;
      let firstPokemon = team.firstPokemon;
      if (firstPokemon === index) {
        firstPokemon = slots.findIndex(s => s !== null);
        if (firstPokemon === -1) firstPokemon = 0;
      }
      return {...team, slots, firstPokemon};
    });
  }

  moveSlot(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) return;
    this._team.update(team => {
      const slots = [...team.slots];
      [slots[fromIndex], slots[toIndex]] = [slots[toIndex], slots[fromIndex]];
      let firstPokemon = team.firstPokemon;
      if (firstPokemon === fromIndex) firstPokemon = toIndex;
      else if (firstPokemon === toIndex) firstPokemon = fromIndex;
      return {...team, slots, firstPokemon};
    });
  }

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

  clearMove(slotIndex: number, moveIndex: number): void {
    this.setMove(slotIndex, moveIndex, this.emptyMove(moveIndex as 0 | 1 | 2 | 3));
  }

  resetTeam(): void {
    this._team.set(this.emptyTeam());
  }

  private loadTeamFromDto(dto: TeamDto, userId: string): Observable<Team> {
    if (!dto.pokemons || dto.pokemons.length === 0) {
      return of({...this.emptyTeam(), userId});
    }

    const slotObservables = dto.pokemons.map((p, i) =>
      this.loadSlotFromDto(p, i as 0 | 1 | 2 | 3 | 4 | 5)
    );

    return forkJoin(slotObservables).pipe(
      map(occupiedSlots => {
        const slots: (TeamSlot | null)[] = Array(6).fill(null);
        occupiedSlots.forEach((slot, i) => { slots[i] = slot; });
        return {userId, slots, firstPokemon: 0};
      }),
      switchMap(team => this.enrichTeamWithFrenchNames(team)),
    );
  }

  private loadSlotFromDto(pokemon: PokemonDto, slotIndex: 0 | 1 | 2 | 3 | 4 | 5): Observable<TeamSlot> {
    const filledMoves: Observable<TeamMove>[] = Array.from({length: 4}, (_, i) => {
      const attack = pokemon.attacks[i];
      return attack
        ? this.loadMoveFromAttackDto(attack, i as 0 | 1 | 2 | 3)
        : of(this.emptyMove(i as 0 | 1 | 2 | 3));
    });

    const segments = pokemon.apiUrl.split('/').filter(Boolean);
    const pokemonId = Number(segments[segments.length - 1]);

    return forkJoin([
      this.pokemonService.getById(pokemonId),
      forkJoin(filledMoves),
    ]).pipe(
      map(([poke, moves]) => ({
        slotIndex,
        pokedexId: poke.id,
        name: poke.name,
        sprite: poke.sprite,
        spriteBack: poke.sprite,
        types: poke.types,
        hp: poke.stats.hp,
        hpMax: poke.stats.hp,
        stats: poke.stats,
        moves,
      } as TeamSlot))
    );
  }

  private loadMoveFromAttackDto(dto: AttackDto, slot: 0 | 1 | 2 | 3): Observable<TeamMove> {
    return this.http.get<any>(dto.apiUrl).pipe(
      map(moveDto => {
        const frenchEntry = (moveDto.names as any[])?.find((n: any) => n.language?.name === 'fr');
        return {
          apiUrl: dto.apiUrl,
          slot,
          name: moveDto.name ?? '',
          frenchName: frenchEntry?.name ?? moveDto.name ?? '',
          type: moveDto.type?.name ?? 'normal',
          power: moveDto.power ?? null,
          accuracy: moveDto.accuracy ?? 100,
          damageClass: moveDto.damage_class?.name ?? 'physical',
        } as TeamMove;
      })
    );
  }

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

  private toTeamDto(team: Team): TeamDto {
    const pokemons = team.slots
      .filter((s): s is TeamSlot => s !== null)
      .map(slot => ({
        apiUrl: `https://pokeapi.co/api/v2/pokemon/${slot.pokedexId}/`,
        attacks: slot.moves
          .filter(m => m.name !== '')
          .map(m => ({
            apiUrl: m.apiUrl ?? `https://pokeapi.co/api/v2/move/${m.name}/`,
          } as AttackDto)),
      } as PokemonDto));
    return {pokemons};
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
