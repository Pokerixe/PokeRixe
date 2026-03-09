import { Routes } from '@angular/router';
import {Home} from './pages/home/home';
import {Pokedex} from './pages/pokedex/pokedex';
import {Fight} from './pages/fight/fight';
import {Equipes} from './pages/equipes/equipes';
import {PokemonPage} from './pages/pokemon/pokemon';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then(m => m.Home)
  },
  {
    path: 'pokedex',
    loadComponent: () => import('./pages/pokedex/pokedex').then(m => m.Pokedex)
  },
  {
    path: 'equipes',
    loadComponent: () => import('./pages/equipes/equipes').then(m => m.Equipes)
  },
  {
    path: 'pokemon/:id',
    loadComponent: () => import('./pages/pokemon/pokemon').then(m => m.PokemonPage)
  },
  {
    path: 'fight',
    loadComponent: () => import('./pages/fight/fight').then(m => m.Fight)
  }
];
