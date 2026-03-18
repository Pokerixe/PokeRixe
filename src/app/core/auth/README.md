# Auth & Session Management — Angular 21

> **Pattern utilisé :** JWT Stateless Auth avec Cookie HttpOnly

---

## C'est quoi ce "pattern" ?

Une architecture qui sépare proprement la logique d'auth (invisible) des pages utilisateur (visible). Elle fonctionne **sans back-end** pendant le développement grâce au Mock Interceptor, puis se connecte au vrai serveur sans modifier le code Angular.

---

## Les 4 choix techniques

### 1. État utilisateur → Signals

Un Signal est une valeur réactive : quand l'utilisateur connecté change, tout ce qui l'écoute se met à jour automatiquement.

3 signals dans `AuthService` :
- `_currentUser` — signal privé en écriture (`User | null`)
- `isAuthenticated` — computed, booléen dérivé automatiquement
- `userRole` — computed, retourne le rôle ou `null`

> Les composants lisent les signals avec `auth.currentUser()` — les `()` sont obligatoires pour lire la valeur.

---

### 2. Stockage du token → Cookie HttpOnly

> Angular ne voit **jamais** le token JWT. C'est le navigateur et le back-end qui s'en occupent.

| Qui | Action | Quand |
|---|---|---|
| Back-end | Crée le cookie | À la connexion (header `Set-Cookie`) |
| Navigateur | Stocke et envoie | Automatiquement à chaque requête |
| Back-end | Supprime le cookie | À la déconnexion (`Set-Cookie` vide) |

⚠️ **Requis côté back-end** : cookies configurés `HttpOnly + Secure + SameSite=Strict`, et CORS autorisé avec `credentials: true`.

---

### 3. Protection des routes → 3 Guards

Les guards s'exécutent dans cet ordre : **Resolver → AuthGuard → RoleGuard**

| Guard | Question posée | Si refus |
|---|---|---|
| `authGuard` | Es-tu connecté ? | Redirect `/login` |
| `roleGuard(Role.X)` | As-tu le bon rôle ? | Redirect `/forbidden` |
| `authResolver` | Les données sont-elles prêtes ? | Attend (pas de redirect) |

Le `roleGuard` utilise une **hiérarchie de privilèges** :
```
Guest (0) < User (1) < Admin (2)
```
Un Admin a accès à tout ce qu'un User peut voir, et ainsi de suite.

---

### 4. Simulation du back-end → Mock Interceptor

L'interceptor se place entre Angular et le réseau. En dev, il répond lui-même aux appels HTTP avec de fausses données. Un utilisateur de test est disponible :

- **Email** : `test@gmail.com`
- **Password** : `password`

```
environment.ts       → useMockApi: true   (développement)
environment.prod.ts  → useMockApi: false  (production)
```

Quand le back-end est prêt : **on change une seule ligne**. Tout le reste reste intact.

---

## Structure du projet

```
src/app/
├── core/
│   ├── auth/
│   │   ├── auth.service.ts            ← cerveau de l'auth (Signals + HTTP)
│   │   ├── auth.mock.interceptor.ts   ← simulation du back-end
│   │   ├── auth.interceptor.ts        ← interceptor de production (withCredentials)
│   │   ├── auth.guard.ts              ← vérifie si connecté
│   │   ├── role.guard.ts              ← vérifie le niveau de privilège
│   │   └── auth.resolver.ts           ← charge le user avant affichage
│   ├── interceptors/
│   │   └── error.interceptor.ts       ← gestion globale des erreurs HTTP
│   └── models/
│       ├── user.model.ts              ← enum Role + interface User
│       └── auth.model.ts              ← LoginDTO, RegisterDTO, AuthResponse
│
├── pages/
│   ├── login/                         ← formulaire de connexion
│   ├── register/                      ← formulaire d'inscription
│   ├── user/                          ← profil utilisateur connecté
│   ├── forbidden/                     ← page d'accès refusé
│   └── admin/                         ← page admin (Role.Admin requis)
│
├── app.routes.ts                      ← routes avec guards
└── app.config.ts                      ← configuration globale + interceptors

environments/
├── environment.ts                     ← useMockApi: true
└── environment.prod.ts                ← useMockApi: false
```

---

## Les models

### `user.model.ts`
```typescript
export enum Role {
  Guest,
  User,
  Admin
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}
```

### `auth.model.ts`
```typescript
export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}
```

---

## Les routes protégées

```typescript
// Page connectés seulement
{ path: 'equipes', canActivate: [authGuard], ... }

// Page avec chargement du user avant affichage
{ path: 'user', canActivate: [authGuard], resolve: { user: authResolver }, ... }

// Page admin seulement
{ path: 'admin', canActivate: [authGuard, roleGuard(Role.Admin)], ... }

// Pages publiques
{ path: 'login', ... }
{ path: 'forbidden', ... }

// Fallback — toujours en dernier
{ path: '**', redirectTo: '' }
```

---

## Récupérer les infos du user dans un composant

```typescript
export class MonComposant {
  auth = inject(AuthService);
}
```

```html
{{ auth.currentUser()?.name }}
{{ auth.currentUser()?.email }}

@if (auth.isAuthenticated()) {
  <p>Bienvenue {{ auth.currentUser()?.name }}</p>
}

@if (auth.userRole() === Role.Admin) {
  <a routerLink="/admin">Panel admin</a>
}
```

---

## Points techniques importants

- Les requêtes HTTP doivent avoir `withCredentials: true` pour envoyer le cookie — géré automatiquement par `auth.interceptor.ts` en production
- `loadCurrentUser()` est appelé au démarrage via `provideAppInitializer` pour restaurer la session après un refresh de page
- Le mock stocke l'utilisateur **en mémoire** dans une variable `mockCurrentUser` pour simuler le comportement du cookie
- Les formulaires utilisent **Reactive Forms** (`FormBuilder`, `Validators`)
- La nouvelle syntaxe Angular 17+ est utilisée partout : `@if`, `@for` au lieu de `*ngIf`, `*ngFor`

---

## Ce qui changera quand le back-end arrivera

- ✅ `AuthService` → rien à changer
- ✅ Guards → rien à changer
- ✅ Pages → rien à changer
- ✅ Models → rien à changer
- 🔧 `environment.ts` → passer `useMockApi` à `false`
- 🔧 Back-end → configurer les cookies HttpOnly + CORS avec `credentials: true`
