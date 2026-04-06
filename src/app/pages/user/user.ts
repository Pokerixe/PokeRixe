import {Component, computed, inject} from '@angular/core';
import {AuthService} from '../../core/auth/auth.service';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Role} from '../../core/models/user.model';
import {routes} from '../../app.routes';

@Component({
  selector: 'app-user',
  imports: [ReactiveFormsModule],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
/**
 * Page de profil utilisateur.
 * Permet à l'utilisateur connecté de consulter et modifier son nom et son email,
 * de voir son rôle, et de se déconnecter.
 *
 * @remarks La mise à jour du profil est actuellement locale (via `AuthService.updateCurrentUserProfile`)
 * en attendant une route backend dédiée.
 */
export class UserPage {

  auth = inject(AuthService);
  private readonly fb= inject(FormBuilder);

  private readonly initialName = this.auth.currentUser()?.name ?? '';
  private readonly initialEmail = this.auth.currentUser()?.email ?? '';

  /** Message de confirmation affiché après une sauvegarde réussie. */
  saveMessage = '';

  /**
   * Formulaire de modification du profil.
   * - `name` : requis, minimum 2 caractères
   * - `email` : requis, format email valide
   */
  profileForm = this.fb.group({
    name: [this.initialName, [Validators.required, Validators.minLength(2)]],
    email: [this.initialEmail, [Validators.required, Validators.email]],
  });

  /** Signal calculé retournant le libellé du rôle de l'utilisateur connecté (`"Admin"`, `"User"`, `"Guest"`). */
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

  /** Déconnecte l'utilisateur et le redirige vers la page d'accueil. */
  onDeconnect() {
    this.auth.logout();
  }
}
