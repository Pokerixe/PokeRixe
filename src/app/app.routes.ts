import { Routes } from '@angular/router';
import {authGuard} from './core/auth/auth.guard';
import {Role} from './core/models/user.model';
import {roleGuard} from './core/auth/role.guard';

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
    //canActivate: [authGuard],
    loadComponent: () => import('./pages/equipes/equipes').then(m => m.Equipes)
  },
  {
    path: 'pokemon/:id',
    loadComponent: () => import('./pages/pokemon/pokemon').then(m => m.PokemonPage)
  },
  {
    path: 'fight',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/fight/fight').then(m => m.Fight)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then(m => m.RegisterPage)
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(Role.Admin)],
    loadComponent: () => import('./pages/admin/admin').then(m => m.AdminPage)
  },
  {
    path: 'user',
    canActivate: [authGuard],
    //resolve: { user: authResolver },
    loadComponent: () => import('./pages/user/user').then(m => m.UserPage)
  },
  {
    path: 'forbidden',
    loadComponent: () => import('./pages/forbidden/forbidden').then(m => m.Forbidden)
  },
  {
    path: 'searchGame',
    loadComponent: () => import('./pages/search-game/search-game').then(m => m.SearchGame)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
