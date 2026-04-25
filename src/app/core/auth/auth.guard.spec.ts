import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('authGuard', () => {
  let authService: Partial<AuthService>;
  let router: Partial<Router>;
  let isAuthenticatedMock: ReturnType<typeof vi.fn>;
  let createUrlTreeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    isAuthenticatedMock = vi.fn();
    createUrlTreeMock = vi.fn();

    authService = {
      isAuthenticated: isAuthenticatedMock as any,
    };

    const mockUrlTree = { path: '/login' } as any as UrlTree;
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

  describe('when user is authenticated', () => {
    beforeEach(() => {
      isAuthenticatedMock.mockReturnValue(true);
    });

    it('returns true', () => {
      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as any, {} as any)
      );

      expect(result).toBe(true);
    });

    it('does not call router.createUrlTree', () => {
      createUrlTreeMock.mockClear();
      TestBed.runInInjectionContext(() =>
        authGuard({} as any, {} as any)
      );

      expect(createUrlTreeMock).not.toHaveBeenCalled();
    });
  });

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      isAuthenticatedMock.mockReturnValue(false);
    });

    it('returns UrlTree from router.createUrlTree', () => {
      const mockUrlTree = { path: '/login' } as any as UrlTree;
      createUrlTreeMock.mockReturnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as any, {} as any)
      );

      expect(result).toBe(mockUrlTree);
    });

    it('calls router.createUrlTree with ["/login"]', () => {
      TestBed.runInInjectionContext(() =>
        authGuard({} as any, {} as any)
      );

      expect(createUrlTreeMock).toHaveBeenCalledWith(['/login']);
    });

    it('checks isAuthenticated to determine auth status', () => {
      TestBed.runInInjectionContext(() =>
        authGuard({} as any, {} as any)
      );

      expect(isAuthenticatedMock).toHaveBeenCalled();
    });
  });

  describe('AuthService.isAuthenticated() integration', () => {
    it('calls AuthService.isAuthenticated() to check auth status', () => {
      isAuthenticatedMock.mockReturnValue(true);
      TestBed.runInInjectionContext(() =>
        authGuard({} as any, {} as any)
      );

      expect(isAuthenticatedMock).toHaveBeenCalled();
    });

    it('returns true when isAuthenticated returns true', () => {
      isAuthenticatedMock.mockReturnValue(true);
      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as any, {} as any)
      );

      expect(result).toBe(true);
    });

    it('redirects when isAuthenticated returns false', () => {
      isAuthenticatedMock.mockReturnValue(false);
      const mockUrlTree = { path: '/login' } as any as UrlTree;
      createUrlTreeMock.mockReturnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as any, {} as any)
      );

      expect(createUrlTreeMock).toHaveBeenCalledWith(['/login']);
      expect(result).toBe(mockUrlTree);
    });
  });

  describe('Router.createUrlTree integration', () => {
    it('uses Router.createUrlTree to create redirect URL', () => {
      isAuthenticatedMock.mockReturnValue(false);
      TestBed.runInInjectionContext(() =>
        authGuard({} as any, {} as any)
      );

      expect(createUrlTreeMock).toHaveBeenCalledWith(['/login']);
    });

    it('returns UrlTree from router.createUrlTree when redirecting', () => {
      isAuthenticatedMock.mockReturnValue(false);
      const mockUrlTree = { path: '/login' } as any as UrlTree;
      createUrlTreeMock.mockReturnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as any, {} as any)
      );

      expect(result).toBe(mockUrlTree);
    });
  });

  describe('TestBed.runInInjectionContext usage', () => {
    it('runs guard within injection context', () => {
      isAuthenticatedMock.mockReturnValue(true);
      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as any, {} as any)
      );

      expect(result).toBe(true);
      expect(isAuthenticatedMock).toHaveBeenCalled();
    });
  });
});
