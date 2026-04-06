# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server at http://localhost:4200
npm run build      # Production build (output: dist/)
npm test           # Run tests with vitest
npm run doc        # Generate & serve Compodoc docs at http://localhost:8080
npm run sonar      # Run SonarQube analysis (requires sonar-project.properties)
```

Run a single test file:
```bash
npx vitest run src/app/pages/home/home.spec.ts
```

## Architecture

**Angular 21** standalone components app (no NgModules). All components use `inject()` for DI and Angular 17+ template syntax (`@if`, `@for`).

### Data flow

```
PokeAPI (public) ─→ PokemonRepository ─→ PokemonService ─→ PokemonStore (signal cache)
                                                                 ↓
Java Spring REST API ─→ services (auth, game, team) → pages/components
```

- **`shared/repositories/`** — raw HTTP calls (PokeAPI only for now)
- **`shared/services/`** — business logic, combines repo calls + mappers
- **`shared/mappers/`** — transforms raw API DTOs to internal models
- **`core/store/pokemon.store.ts`** — global signal-based state, batches 150 pokémon in groups of 20 with 5-min cache
- **`core/game/game.service.ts`** and **`core/team/team.service.ts`** — hold signal state for the backend API

### Auth system

Auth uses **cookie HttpOnly + JWT** managed entirely by the backend. Angular never sees the token.

- `core/auth/auth.service.ts` — central auth state via Signals (`currentUser`, `isAuthenticated`, `userRole`)
- `auth.interceptor.ts` — adds `withCredentials: true` to all requests (prod)
- `auth.mock.interceptor.ts` — intercepts HTTP calls and returns fake data in dev (test creds: `test@gmail.com` / `password`)
- Toggle via `environment.ts`: `useMockApi: true` (dev) / `false` (prod)
- `loadCurrentUser()` is called at startup via `provideAppInitializer` to restore session on page refresh

### Route guards

Guards execute in order: `authGuard` → `roleGuard(Role.X)`

- `authGuard` — requires authenticated user, redirects to `/login`
- `roleGuard` — requires minimum role level (Guest=0, User=1, Admin=2), redirects to `/forbidden`

### Environments

- `src/environments/environment.ts` — dev (`useMockApi: true`, `apiUrl: 'http://localhost:3000/api/'`)
- `src/environments/environment.prod.ts` — production
- `src/environments/environment.staging.ts` — staging

### Code style

Prettier is configured with `printWidth: 100`, `singleQuote: true`, and `angular` parser for HTML files.
