import { Routes } from '@angular/router';
import {UserPage} from './pages/user/user';

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
  },
  {
    path: 'user',
    loadComponent: () => import('./pages/user/user').then(m => m.UserPage)
  }
];
