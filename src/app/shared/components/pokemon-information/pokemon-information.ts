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
/**
 * Panneau d'informations détaillées d'un Pokémon dans la gestion d'équipe.
 * Charge automatiquement les données du Pokémon (stats, attaques, types) à chaque changement
 * de `pokemon_id`, et synchronise les attaques possédées depuis le `TeamService`.
 *
 * Émet trois événements vers le parent (`Equipes`) :
 * - `movesLoaded` — liste complète des attaques disponibles pour ce Pokémon
 * - `changeToMoveMode` — demande d'ouverture du sélecteur pour un slot d'attaque
 * - `removePokemon` — demande de retrait du Pokémon de l'équipe
 */
export class PokemonInformation implements OnChanges {

  private readonly pokemonService = inject(PokemonService);
  private readonly teamService = inject(TeamService);

  /** Numéro du Pokédex du Pokémon à afficher. Déclenche un rechargement à chaque changement. */
  pokemon_id = input<number>(1);

  /** `true` pendant le chargement des données du Pokémon. */
  isLoading: boolean = true;
  /** Message d'erreur en cas d'échec du chargement, `null` sinon. */
  error: string | null = null;

  /** Données complètes du Pokémon chargé depuis l'API. */
  pokemon: Pokemon | null = null;
  /** Liste des attaques disponibles pour ce Pokémon (filtrées et triées). */
  displayedMoves: MoveModel[] = [];
  /** Attaques actuellement assignées au Pokémon dans l'équipe (4 slots). */
  ownedMoves: TeamMove[] = [];

  /** Émis avec la liste complète des attaques disponibles après chargement. */
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
        // Les moves sont déjà filtrés et triés par le service MoveService.loadMovesFromDtos
        this.displayedMoves = moves || [];
        this.movesLoaded.emit(this.displayedMoves);
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

  /** Émis avec l'index du slot d'attaque (1-4) pour ouvrir le sélecteur d'attaque. */
  @Output() changeToMoveMode = new EventEmitter<number>();

  /**
   * Déclenche le mode sélection d'attaque pour le slot indiqué.
   * @param moveNumber Index du slot d'attaque (1 à 4)
   */
  setModeToChangeMove(moveNumber: number) {
    this.changeToMoveMode.emit(moveNumber);
  }

  /** Émis lorsque l'utilisateur demande à retirer ce Pokémon de l'équipe. */
  @Output() removePokemon = new EventEmitter<void>();

  /** Émet `removePokemon` pour notifier le composant parent du retrait. */
  protected removePoke() {
    this.removePokemon.emit();
  }
}
