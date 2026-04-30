import {Component, computed, effect, inject} from '@angular/core';
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
export class UserPage {

  auth = inject(AuthService);
  private readonly fb= inject(FormBuilder);

  saveMessage = '';

  profileForm = this.fb.group({
    pseudo: ['', [Validators.required, Validators.minLength(2)]],
    mail: ['', [Validators.required, Validators.email]],
  });

  readonly currentRoleLabel = computed(() => {
    const role = this.auth.currentUser()?.role;
    if (role === undefined || role === null) return 'Inconnu';
    return Role[role] ?? 'Inconnu';
  });

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        this.profileForm.patchValue({ pseudo: user.pseudo, mail: user.mail }, { emitEvent: false });
      }
    });
  }

  onSubmit() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const values = this.profileForm.value;
    this.auth.updateCurrentUserProfile({
      pseudo: values.pseudo!,         
      mail: values.mail!,
    });
    this.saveMessage = 'Modifications enregistrees.';
  }

  onReset() {
    const user = this.auth.currentUser();
    this.profileForm.reset({ pseudo: user?.pseudo ?? '', mail: user?.mail ?? '' });
    this.saveMessage = '';
  }

  onDeconnect() {
    this.auth.logout();
  }
}
