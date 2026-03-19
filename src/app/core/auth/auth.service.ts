import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {User} from '../models/user.model';
import {AuthResponse, LoginDTO, RegisterDTO} from '../models/auth.model';
import {environment} from '../../../environments/environment';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

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
    this.http.post<AuthResponse>(this.API_URL + 'login', loginDTO).subscribe({
      next: (response: AuthResponse) => {
        this._currentUser.set(response.user); // Mise a jour du signal
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
    this.http.post<AuthResponse>(this.API_URL + 'register', registerDTO).subscribe({
      next: (response: AuthResponse) => {
        this._currentUser.set(response.user);
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
    this.http.post<void>(this.API_URL + 'logout', {}).subscribe({
      next: () => {
        this._currentUser.set(null);
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
    this.http.get<AuthResponse>(this.API_URL + 'me').subscribe({
      next: (response: AuthResponse) => {
        if (response?.user) {
          this._currentUser.set(response.user);
        }
      },
      error: (err) => {
        console.error('Failed to load current qdqdqd', err);
        this._currentUser.set(null);
      }
    });
  }

  /**
   * Met a jour localement le profil de l'utilisateur courant.
   * Utilise pour la page profil en attendant une route backend dediee.
   */
  updateCurrentUserProfile(payload: { name: string; email: string }) {
    const current = this._currentUser();
    if (!current) return;

    this._currentUser.set({
      ...current,
      name: payload.name,
      email: payload.email,
    });
  }

}
