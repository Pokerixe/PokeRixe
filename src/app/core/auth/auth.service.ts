import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {User} from '../models/user.model';
import {LoginDTO, RegisterDTO, UpdateDTO} from '../models/auth.model';
import {environment} from '../../../environments/environment';
import {Router} from '@angular/router';
import { TeamService } from "../team/team.service";
import { ApiResponse } from '../../shared/models/api-response.model';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly team = inject(TeamService);

  private readonly API_URL = environment.apiUrl;

  private readonly _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();

  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  /** Computed pour obtenir le rôle de l'utilisateur courant, ou null s'il n'est pas connecté
   * Utile pour les guards et pour gérer l'affichage en fonction du rôle
   */
  readonly userRole = computed(() => {
    const user = this._currentUser();
    return user ? user.role : null;
  });

  /**
   * Effectue une requete de login et met a jour le signal currentUser en cas de succes
   * @param loginDTO les credentials de connexion
   */
  login(loginDTO: LoginDTO) {
    const params = new HttpParams().set('mail', loginDTO.mail).set('password', loginDTO.password);
    this.http.post<User>(this.API_URL + 'auth/signin', null, { params }).subscribe({
      next: (user: User) => {
        this._currentUser.set(user);
        this.team.loadTeam(user.id).subscribe();
        this.loadCurrentUser();
        this.router.navigateByUrl('/');
      },
      error: (err) => {
        console.error('Login failed', err);
      }
    });
  }

  /**
   * Effectue une requete d'inscription et met a jour le signal currentUser en cas de succes
   * @param registerDTO les informations d'inscription
   */
  register(registerDTO: RegisterDTO) {
    const params = new HttpParams().set('pseudo', registerDTO.pseudo).set('mail', registerDTO.mail).set('password', registerDTO.password);
    this.http.post<User>(this.API_URL + 'auth/signup', null, { params }).subscribe({
      next: (user: User) => {
        this._currentUser.set(user);
        this.loadCurrentUser();
        this.router.navigateByUrl('/');
      },
      error: (err) => {
        console.error('Registration failed', err);
      }
    });
  }

  /**
   * Effectue une requete de logout et met a jour le signal currentUser en cas de succes
   */
  logout() {
    this.http.post<void>(this.API_URL + 'auth/signout', {}).subscribe({
      next: () => {
        this.team.resetTeam();
        this._currentUser.set(null);
        this.router.navigateByUrl('/');
      },
      error: (err) => {
        console.error('Logout failed', err);
      }
    });
  }

  /**
   * Charge les informations de l'utilisateur courant depuis le backend et met a jour le signal currentUser
   * Cette méthode est appelée au démarrage de l'application pour vérifier si l'utilisateur est déjà connecté (ex: cookie de session valide)
   * et pour récupérer les informations de l'utilisateur (ex: rôle) afin de gérer l'affichage et les autorisations
   * en conséquence.
   * Si la requete échoue (ex: pas de session valide), le signal currentUser est mis à null.
   *
   */
  loadCurrentUser() {
    this.http.get<User>(this.API_URL + 'users/me').subscribe({
      next: (user: User) => {
        if (user) {
          this._currentUser.set(user);
          this.team.loadTeam(user.id).subscribe();
        }
      },
      error: (err) => {
        console.error('Failed to load current user', err);
        this._currentUser.set(null);
      }
    });
  }

  /**
   * Met à jour le profil de l'utilisateur courant (nom et email).
   * @param updateDTO Objet contenant le nouveau `name` et le nouveau`mail`
   */
  updateCurrentUserProfile(updateDTO: UpdateDTO) {
    const params = new HttpParams().set('pseudo', updateDTO.pseudo).set('mail', updateDTO.mail);
    this.http.patch<User>(this.API_URL + 'users/profile', null, { params }).subscribe ({
      next: (user:User) => {
        if (user) {
          this._currentUser.set(user);
        }
      },
      error: (err) => {
        console.error('Failed to update current user',err);
      }
      }   
    );

  }

}
