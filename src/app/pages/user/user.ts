import {Component, computed, inject} from '@angular/core';
import {AuthService} from '../../core/auth/auth.service';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Role} from '../../core/models/user.model';

@Component({
  selector: 'app-user',
  imports: [ReactiveFormsModule],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class UserPage {

  auth = inject(AuthService);
  private readonly fb= inject(FormBuilder);

  private readonly initialName = this.auth.currentUser()?.name ?? '';
  private readonly initialEmail = this.auth.currentUser()?.email ?? '';

  saveMessage = '';

  profileForm = this.fb.group({
    name: [this.initialName, [Validators.required, Validators.minLength(2)]],
    email: [this.initialEmail, [Validators.required, Validators.email]],
  });

  readonly currentRoleLabel = computed(() => {
    const role = this.auth.currentUser()?.role;
    if (role === undefined || role === null) return 'Inconnu';
    return Role[role] ?? 'Inconnu';
  });

  /**
   * Soumission du formulaire de profil utilisateur
   * Valide les champs et met à jour le profil de l'utilisateur via le service d'authentification
   * Affiche un message de succès après la mise à jour
   */
  onSubmit() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const values = this.profileForm.value;
    this.auth.updateCurrentUserProfile({
      name: values.name!,
      email: values.email!,
    });
    this.saveMessage = 'Modifications enregistrees.';
  }

  /**
   * Réinitialise le formulaire aux valeurs initiales (nom et email de l'utilisateur courant)
   * Efface également le message de succès
   */
  onReset() {
    this.profileForm.reset({
      name: this.auth.currentUser()?.name ?? this.initialName,
      email: this.auth.currentUser()?.email ?? this.initialEmail,
    });
    this.saveMessage = '';
  }
}
