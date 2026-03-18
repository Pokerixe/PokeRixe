import {Component, inject} from '@angular/core';
import {AuthService} from '../../core/auth/auth.service';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterPage {


  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  /**
   * Formulaire d'inscription
   * - name : champ de texte requis
   * - email : champ de texte requis avec validation d'email
   * - password : champ de texte requis avec validation de longueur minimale de 6 caractères
   */
  registerForm = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  /**
   * OnSubmit : Valide le formulaire et appelle la méthode de registre du service d'authentification avec les valeurs du formulaire.
   */
  onSubmit() {
    if (this.registerForm.invalid) return;

    const values = this.registerForm.value;
    this.auth.register({
      name: values.name!,
      email: values.email!,
      password: values.password!
    });
  }

}
