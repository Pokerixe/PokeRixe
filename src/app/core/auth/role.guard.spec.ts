import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthService } from './auth.service';
import { Role } from '../models/user.model';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('roleGuard', () => {
  let authService: Partial<AuthService>;
  let router: Partial<Router>;
  let userRoleMock: ReturnType<typeof vi.fn>;
  let createUrlTreeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    userRoleMock = vi.fn();
    createUrlTreeMock = vi.fn();

    authService = {
      userRole: userRoleMock as any,
    };

    const mockUrlTree = { path: '/forbidden' } as any as UrlTree;
    createUrlTreeMock.mockReturnValue(mockUrlTree);

    router = {
      createUrlTree: createUrlTreeMock as any,
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  describe('when user role is null (not authenticated)', () => {
    beforeEach(() => {
      userRoleMock.mockReturnValue(null);
    });

    it('should deny access and return UrlTree to /forbidden', () => {
      const mockUrlTree = { path: '/forbidden' } as any as UrlTree;
      createUrlTreeMock.mockReturnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() =>
        roleGuard(Role.Guest)({} as any, {} as any)
      );

      expect(createUrlTreeMock).toHaveBeenCalledWith(['/forbidden']);
      expect(result).toBe(mockUrlTree);
    });

    it('should deny Admin route access when not authenticated', () => {
      const mockUrlTree = { path: '/forbidden' } as any as UrlTree;
      createUrlTreeMock.mockReturnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() =>
        roleGuard(Role.Admin)({} as any, {} as any)
      );

      expect(createUrlTreeMock).toHaveBeenCalledWith(['/forbidden']);
      expect(result).toBe(mockUrlTree);
    });

    it('should deny User route access when not authenticated', () => {
      const mockUrlTree = { path: '/forbidden' } as any as UrlTree;
      createUrlTreeMock.mockReturnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() =>
        roleGuard(Role.User)({} as any, {} as any)
      );

      expect(createUrlTreeMock).toHaveBeenCalledWith(['/forbidden']);
      expect(result).toBe(mockUrlTree);
    });
  });

  describe('Guest user (role priority 0)', () => {
    beforeEach(() => {
      userRoleMock.mockReturnValue(Role.Guest);
    });

    it('should allow access to Guest-required routes', () => {
      createUrlTreeMock.mockClear();
      const result = TestBed.runInInjectionContext(() =>
        roleGuard(Role.Guest)({} as any, {} as any)
      );

      expect(result).toBe(true);
      expect(createUrlTreeMock).not.toHaveBeenCalled();
    });

    it('should deny access to User-required routes', () => {
      const mockUrlTree = { path: '/forbidden' } as any as UrlTree;
      createUrlTreeMock.mockReturnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() =>
        roleGuard(Role.User)({} as any, {} as any)
      );

      expect(createUrlTreeMock).toHaveBeenCalledWith(['/forbidden']);
      expect(result).toBe(mockUrlTree);
    });

    it('should deny access to Admin-required routes', () => {
      const mockUrlTree = { path: '/forbidden' } as any as UrlTree;
      createUrlTreeMock.mockReturnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() =>
        roleGuard(Role.Admin)({} as any, {} as any)
      );

      expect(createUrlTreeMock).toHaveBeenCalledWith(['/forbidden']);
      expect(result).toBe(mockUrlTree);
    });
  });

  describe('User role (role priority 1)', () => {
    beforeEach(() => {
      userRoleMock.mockReturnValue(Role.User);
    });

    it('should allow access to Guest-required routes', () => {
      createUrlTreeMock.mockClear();
      const result = TestBed.runInInjectionContext(() =>
        roleGuard(Role.Guest)({} as any, {} as any)
      );

      expect(result).toBe(true);
      expect(createUrlTreeMock).not.toHaveBeenCalled();
    });

    it('should allow access to User-required routes', () => {
      createUrlTreeMock.mockClear();
      const result = TestBed.runInInjectionContext(() =>
        roleGuard(Role.User)({} as any, {} as any)
      );

      expect(result).toBe(true);
      expect(createUrlTreeMock).not.toHaveBeenCalled();
    });

    it('should deny access to Admin-required routes', () => {
      const mockUrlTree = { path: '/forbidden' } as any as UrlTree;
      createUrlTreeMock.mockReturnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() =>
        roleGuard(Role.Admin)({} as any, {} as any)
      );

      expect(createUrlTreeMock).toHaveBeenCalledWith(['/forbidden']);
      expect(result).toBe(mockUrlTree);
    });
  });

  describe('Admin user (role priority 2)', () => {
    beforeEach(() => {
      userRoleMock.mockReturnValue(Role.Admin);
    });

    it('should allow access to Guest-required routes', () => {
      createUrlTreeMock.mockClear();
      const result = TestBed.runInInjectionContext(() =>
        roleGuard(Role.Guest)({} as any, {} as any)
      );

      expect(result).toBe(true);
      expect(createUrlTreeMock).not.toHaveBeenCalled();
    });

    it('should allow access to User-required routes', () => {
      createUrlTreeMock.mockClear();
      const result = TestBed.runInInjectionContext(() =>
        roleGuard(Role.User)({} as any, {} as any)
      );

      expect(result).toBe(true);
      expect(createUrlTreeMock).not.toHaveBeenCalled();
    });

    it('should allow access to Admin-required routes', () => {
      createUrlTreeMock.mockClear();
      const result = TestBed.runInInjectionContext(() =>
        roleGuard(Role.Admin)({} as any, {} as any)
      );

      expect(result).toBe(true);
      expect(createUrlTreeMock).not.toHaveBeenCalled();
    });
  });

  describe('role hierarchy enforcement', () => {
    it('allows access when user role equals required role', () => {
      userRoleMock.mockReturnValue(Role.User);
      createUrlTreeMock.mockClear();
      const result = TestBed.runInInjectionContext(() =>
        roleGuard(Role.User)({} as any, {} as any)
      );

      expect(result).toBe(true);
    });

    it('allows access when user role is higher than required', () => {
      userRoleMock.mockReturnValue(Role.Admin);
      createUrlTreeMock.mockClear();
      const result = TestBed.runInInjectionContext(() =>
        roleGuard(Role.Guest)({} as any, {} as any)
      );

      expect(result).toBe(true);
    });

    it('denies access when user role is lower than required', () => {
      userRoleMock.mockReturnValue(Role.Guest);
      const mockUrlTree = { path: '/forbidden' } as any as UrlTree;
      createUrlTreeMock.mockReturnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() =>
        roleGuard(Role.Admin)({} as any, {} as any)
      );

      expect(createUrlTreeMock).toHaveBeenCalledWith(['/forbidden']);
      expect(result).toBe(mockUrlTree);
    });

    it('returns UrlTree on denial (not boolean false)', () => {
      userRoleMock.mockReturnValue(Role.Guest);
      const mockUrlTree = { path: '/forbidden' } as any as UrlTree;
      createUrlTreeMock.mockReturnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() =>
        roleGuard(Role.Admin)({} as any, {} as any)
      );

      expect(result).toBe(mockUrlTree);
    });
  });
});
