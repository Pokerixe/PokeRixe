import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { UserPage } from './user';
import { AuthService } from '../../core/auth/auth.service';
import { Role, User } from '../../core/models/user.model';

const mkUser = (role: Role): User => ({
  id: '1',
  name: 'TestUser',
  email: 'test@test.com',
  role,
});

function buildAuthSvc(user: User | null = null) {
  const _currentUser = signal<User | null>(user);
  return {
    _currentUser,
    currentUser: _currentUser.asReadonly(),
    isAuthenticated: signal(user !== null),
    updateCurrentUserProfile: vi.fn().mockImplementation((payload: { name: string; email: string }) => {
      const current = _currentUser();
      if (current) _currentUser.set({ ...current, ...payload });
    }),
    logout: vi.fn(),
  };
}

describe('UserPage', () => {
  let component: UserPage;
  let fixture: ComponentFixture<UserPage>;
  let authSvc: ReturnType<typeof buildAuthSvc>;

  async function setup(user: User | null = null) {
    authSvc = buildAuthSvc(user);
    await TestBed.configureTestingModule({
      imports: [UserPage],
      providers: [{ provide: AuthService, useValue: authSvc }],
    }).compileComponents();
    fixture = TestBed.createComponent(UserPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  describe('currentRoleLabel', () => {
    it('returns "Inconnu" when no user is connected', async () => {
      await setup(null);
      expect(component.currentRoleLabel()).toBe('Inconnu');
    });

    it('returns "Admin" for the Admin role', async () => {
      await setup(mkUser(Role.Admin));
      expect(component.currentRoleLabel()).toBe('Admin');
    });

    it('returns "User" for the User role', async () => {
      await setup(mkUser(Role.User));
      expect(component.currentRoleLabel()).toBe('User');
    });

    it('returns "Guest" for the Guest role', async () => {
      await setup(mkUser(Role.Guest));
      expect(component.currentRoleLabel()).toBe('Guest');
    });
  });

  describe('onSubmit()', () => {
    it('marks all fields as touched and does not update when form is invalid', async () => {
      await setup(null);
      component.profileForm.controls.name.setValue('');
      component.onSubmit();
      expect(component.profileForm.controls.name.touched).toBe(true);
      expect(authSvc.updateCurrentUserProfile).not.toHaveBeenCalled();
      expect(component.saveMessage).toBe('');
    });

    it('updates the user profile and sets a success message when form is valid', async () => {
      await setup(mkUser(Role.User));
      component.profileForm.setValue({ name: 'NewName', email: 'new@email.com' });
      component.onSubmit();
      expect(authSvc.updateCurrentUserProfile).toHaveBeenCalledWith({
        name: 'NewName',
        email: 'new@email.com',
      });
      expect(component.saveMessage).toBe('Modifications enregistrees.');
    });
  });

  describe('onReset()', () => {
    it('resets the form to the current user values', async () => {
      const user = mkUser(Role.User);
      await setup(user);
      component.profileForm.setValue({ name: 'Changed', email: 'changed@test.com' });
      component.onReset();
      expect(component.profileForm.value.name).toBe(user.name);
      expect(component.profileForm.value.email).toBe(user.email);
    });

    it('clears the save message', async () => {
      await setup(mkUser(Role.User));
      component.saveMessage = 'Some message';
      component.onReset();
      expect(component.saveMessage).toBe('');
    });
  });

  describe('onDeconnect()', () => {
    it('calls auth.logout()', async () => {
      await setup();
      component.onDeconnect();
      expect(authSvc.logout).toHaveBeenCalled();
    });
  });
});
