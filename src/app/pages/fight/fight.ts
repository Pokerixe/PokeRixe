import {Component, computed, inject} from '@angular/core';
import {Move} from '../../shared/components/move/move';
import {FightLog} from '../../shared/components/fight-log/fight-log';
import {FightPokemonCard} from '../../shared/components/fight-pokemon-card/fight-pokemon-card';
import {test} from 'vitest';
import {HpBar} from '../../shared/components/hp-bar/hp-bar';
import {TeamService} from '../../core/team/team.service';
import {AuthService} from '../../core/auth/auth.service';

@Component({
  selector: 'app-fight',
  imports: [
    Move,
    FightLog,
    FightPokemonCard,
    HpBar
  ],
  templateUrl: './fight.html',
  styleUrl: './fight.css',
})
/**
 * Page d'interface de combat JCJ (Joueur contre Joueur).
 *
 * Affiche le terrain de combat avec les Pokémon du joueur et de l'adversaire,
 * ainsi que les boutons d'attaque et le journal de combat.
 *
 * @remarks La logique de combat (gestion des tours, calcul des dégâts, synchronisation réseau)
 * sera implémentée ultérieurement dans `FightService` lorsque le backend sera disponible.
 */
export class Fight {

  private readonly teamService = inject(TeamService);
  private readonly userService = inject(AuthService);

  /** Signal des 6 slots de l'équipe du joueur. */
  public teamPokemon = this.teamService.slots;
  /** Index du Pokémon de tête (celui qui combat en premier). */
  public firstPokemon = this.teamService.firstPokemon;

  /** Signal de l'utilisateur connecté (pour afficher son nom en combat). */
  readonly user = this.userService.currentUser;
}
