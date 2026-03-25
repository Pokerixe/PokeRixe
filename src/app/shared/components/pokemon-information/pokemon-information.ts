import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import {PokemonService} from '../../services/pokemon.service';
import {Type} from '../type/type';
import {Pokemon} from '../../models/pokemon.model';
import {Stats} from '../stats/stats';
import {Move as MoveComponent} from '../move/move';
import {Move as MoveModel} from '../../models/move.model';
import {TeamService} from '../../../core/team/team.service';
import {TeamMove, TeamSlot} from '../../../core/team/team.model';

@Component({
  selector: 'app-pokemon-information',
  imports: [
    Type,
    Stats,
    MoveComponent
  ],
  templateUrl: './pokemon-information.html',
  styleUrl: './pokemon-information.css',
})
export class PokemonInformation implements OnChanges {

  private readonly pokemonService = inject(PokemonService);
  private readonly teamService = inject(TeamService);

  pokemon_id = input<number>(1);

  isLoading: boolean = true;
  error: string | null = null;

  pokemon: Pokemon | null = null;

  displayedMoves: MoveModel[] = [];

  ownedMoves: TeamMove[] = [];

  @Output() movesLoaded = new EventEmitter<MoveModel[]>();

  constructor(private readonly cdr: ChangeDetectorRef) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pokemon_id']) {
      const id = this.pokemon_id();
      if (!id || id <= 0) {
        this.pokemon = null;
        this.displayedMoves = [];
        this.ownedMoves = [];
        this.isLoading = false;
        this.error = null;
        this.movesLoaded.emit([]);
        return;
      }
      this.loadPokemon(id);
      this.updateOwnedMovesFromTeam(id);
    }
  }

  private loadPokemon(id: number) {
    this.isLoading = true;
    this.error = null;
    this.pokemon = null;
    this.displayedMoves = [];

    this.pokemonService.getByIdWithMoves(id).subscribe({
      next: ({pokemon, moves}) => {
        this.pokemon = pokemon;
        this.displayedMoves = moves;
        this.movesLoaded.emit(moves);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors du chargement du Pokémon', err);
        this.error = 'Impossible de charger ce Pokémon.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private updateOwnedMovesFromTeam(pokedexId: number) {
    const slots = this.teamService.slots() as (TeamSlot | null)[];
    const slot: TeamSlot | null =
      (slots.find((s: TeamSlot | null) => s !== null && s.pokedexId === pokedexId) as TeamSlot | null) ?? null;

    const fallback = (slotNumber: 0 | 1 | 2 | 3): TeamMove => ({
      slot: slotNumber,
      name: '',
      type: 'normal',
      power: null,
      accuracy: 100,
      damageClass: 'physical',
    });

    if (!slot) {
      this.ownedMoves = [
        fallback(0),
        fallback(1),
        fallback(2),
        fallback(3),
      ];
      return;
    }

    const moves = slot.moves ?? [];
    this.ownedMoves = [
      moves[0] ?? fallback(0),
      moves[1] ?? fallback(1),
      moves[2] ?? fallback(2),
      moves[3] ?? fallback(3),
    ];
  }

  @Output() changeToMoveMode = new EventEmitter<number>();

  setModeToChangeMove(moveNumber: number) {
    this.changeToMoveMode.emit(moveNumber);
  }

  protected readonly String = String;
  protected readonly Type = Type;

  @Output() removePokemon = new EventEmitter<void>();

  protected removePoke() {
    this.removePokemon.emit();
  }
}
