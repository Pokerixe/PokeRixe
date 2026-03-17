import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {User} from '../models/user.model';
import {AuthResponse, LoginDTO, RegisterDTO} from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private http = inject(HttpClient);

  private readonly API_URL = 'http://api_example/';

  private _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();

  readonly isAuthenticated =  computed(() => this._currentUser() !== null);

  readonly userRole = computed(() => {
    const user = this._currentUser();
    return user ? user.role : null;
  });

  login (loginDTO : LoginDTO)  {
    this.http.post<AuthResponse>(this.API_URL + 'login', loginDTO, { withCredentials: true }).subscribe({
      next: (response: AuthResponse) => {
        this._currentUser.set(response.user); // Mise a jour du signal
      },
      error: (err) => {
        console.error('Login failed', err);
      }
    });
  }

  register (registerDTO : RegisterDTO  ) {
    this.http.post<AuthResponse>(this.API_URL + 'register', registerDTO, { withCredentials: true }).subscribe({
      next: (response: AuthResponse) => {
        this._currentUser.set(response.user);
      },
      error: (err) => {
        console.error('Registration failed', err);
      }
    });
  }

  logout() {
    this.http.post<void>(this.API_URL + 'logout',{},{ withCredentials: true }).subscribe({
      next: () => {
        this._currentUser.set(null);
      },
      error: (err) => {
        console.error('Logout failed', err);
      }
    });
  }

  loadCurrentUser() {
    this.http.get<AuthResponse>(this.API_URL + 'me',{ withCredentials: true }).subscribe({
      next: (response: AuthResponse) => {
        this._currentUser.set(response.user);
      },
      error: (err) => {
        console.error('Failed to load current user', err);
        this._currentUser.set(null);
      }
    });
  }

}
