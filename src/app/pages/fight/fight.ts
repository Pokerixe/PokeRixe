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
export class Fight {

  private readonly teamService = inject(TeamService);
  private readonly userService = inject(AuthService);

  public teamPokemon = this.teamService.slots;
  public firstPokemon = this.teamService.firstPokemon;

  readonly user = this.userService.currentUser;
}
