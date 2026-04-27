import {Component, inject} from '@angular/core';
import {AuthService} from '../../core/auth/auth.service';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
/**
 * Page de connexion.
 * Affiche un formulaire réactif avec validation des champs email et mot de passe.
 * En cas de succès, `AuthService.login()` redirige automatiquement vers la page d'accueil.
 */
export class LoginPage {

  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  /**
   * Formulaire de connexion avec validation des champs
   * - email : requis et doit être un email valide
   * - password : requis et doit avoir au moins 6 caractères
   */
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  /**
   * Soumission du formulaire de connexion
   */
  onSubmit() {
    if (this.loginForm.invalid) return;

    const values = this.loginForm.value;
    this.auth.login({
      mail: values.email!,
      password: values.password!
    });
  }



}
