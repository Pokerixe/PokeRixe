import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from './auth.service';
import { TeamService } from '../team/team.service';
import { Role, User } from '../models/user.model';
import { Team } from '../team/team.model';

const mockUser: User = { id: '1', pseudo: 'Test User', mail: 'test@gmail.com', role: Role.User };

const mockTeam: Team = { userId: '1', firstPokemon: 0, slots: Array(6).fill(null) };

const apiResp = <T>(data: T) => ({ code: '200', message: 'OK', data });

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let loadTeamMock: ReturnType<typeof vi.fn>;
  let resetTeamMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    loadTeamMock = vi.fn().mockReturnValue(of(mockTeam));
    resetTeamMock = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TeamService, useValue: { loadTeam: loadTeamMock, resetTeam: resetTeamMock } },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('Computed signals (initial state)', () => {
    it('isAuthenticated() is false when no user', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('userRole() is null when no user', () => {
      expect(service.userRole()).toBeNull();
    });
  });

  describe('login()', () => {
    it('sets currentUser signal on success', () => {
      service.login({ mail: 'test@gmail.com', password: 'password' });

      const req = httpMock.expectOne(r => r.url.includes('/login'));
      expect(req.request.method).toBe('POST');
      req.flush(apiResp({ user: mockUser }));

      expect(service.currentUser()).toEqual(mockUser);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.userRole()).toBe(Role.User);
      expect(loadTeamMock).toHaveBeenCalledWith(mockUser.id);
    });

    it('sends correct body', () => {
      service.login({ mail: 'test@gmail.com', password: 'password' });

      const req = httpMock.expectOne(r => r.url.includes('/login'));
      expect(req.request.body).toEqual({ mail: 'test@gmail.com', password: 'password' });
      req.flush(apiResp({ user: mockUser }));
    });

    it('leaves currentUser null when response user is null', () => {
      service.login({ mail: 'wrong@email.com', password: 'bad' });

      const req = httpMock.expectOne(r => r.url.includes('/login'));
      req.flush(apiResp({ user: null }));

      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('register()', () => {
    it('sets currentUser signal on success', () => {
      service.register({ pseudo: 'New User', mail: 'new@example.com', password: 'pass123' });

      const req = httpMock.expectOne(r => r.url.includes('/register'));
      expect(req.request.method).toBe('POST');
      req.flush(apiResp({ user: mockUser }));

      expect(service.currentUser()).toEqual(mockUser);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('sends correct body', () => {
      const dto = { pseudo: 'New User', mail: 'new@example.com', password: 'pass123' };
      service.register(dto);

      const req = httpMock.expectOne(r => r.url.includes('/register'));
      expect(req.request.body).toEqual(dto);
      req.flush(apiResp({ user: mockUser }));
    });
  });

  describe('logout()', () => {
    it('clears currentUser and calls resetTeam', () => {
      // Pre-login to set a user
      service.login({ mail: 'test@gmail.com', password: 'password' });
      httpMock.expectOne(r => r.url.includes('/login')).flush(apiResp({ user: mockUser }));
      expect(service.isAuthenticated()).toBe(true);

      service.logout();
      const req = httpMock.expectOne(r => r.url.includes('/logout'));
      expect(req.request.method).toBe('POST');
      req.flush(null);

      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(resetTeamMock).toHaveBeenCalled();
    });
  });

  describe('loadCurrentUser()', () => {
    it('sets currentUser when session is valid', () => {
      service.loadCurrentUser();

      const req = httpMock.expectOne(r => r.url.includes('/me'));
      expect(req.request.method).toBe('GET');
      req.flush(apiResp({ user: mockUser }));

      expect(service.currentUser()).toEqual(mockUser);
      expect(service.isAuthenticated()).toBe(true);
      expect(loadTeamMock).toHaveBeenCalledWith(mockUser.id);
    });

    it('sets currentUser to null on HTTP error', () => {
      service.loadCurrentUser();

      const req = httpMock.expectOne(r => r.url.includes('/me'));
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(service.currentUser()).toBeNull();
    });

    it('does not update currentUser when user field is null', () => {
      service.loadCurrentUser();

      const req = httpMock.expectOne(r => r.url.includes('/me'));
      req.flush(apiResp({ user: null }));

      expect(service.currentUser()).toBeNull();
    });
  });
});
