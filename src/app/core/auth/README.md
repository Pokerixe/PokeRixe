# AuthService & Session Management — Angular 21

> **Pattern utilisé :** JWT Stateless AuthService avec Cookie HttpOnly

---

## C'est quoi ce "pattern" ?

Une architecture qui sépare proprement la logique d'auth (invisible) des pages utilisateur (visible). Elle fonctionne **sans back-end** pendant le développement grâce au Mock Interceptor, puis se connecte au vrai serveur sans modifier le code Angular.

---

## Les 4 choix techniques

### ✅1. État utilisateur → Signals

Un Signal est une valeur réactive : quand l'utilisateur connecté change, tout ce qui l'écoute se met à jour automatiquement.

On aura 3 signals principaux :
- `currentUser` — qui est connecté (`null` si personne)
- `isAuthenticated` — booléen dérivé du signal ci-dessus
- `userRole` — le rôle (`admin`, `user`, `guest`)

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
| `AuthGuard` | Es-tu connecté ? | Redirect `/login` |
| `RoleGuard` | As-tu le bon rôle ? | Redirect `/forbidden` |
| `AuthResolver` | Les données sont-elles prêtes ? | Attend (pas de redirect) |

---

### 4. Simulation du back-end → Mock Interceptor

L'interceptor se place entre Angular et le réseau. En dev, il répond lui-même aux appels HTTP avec de fausses données.

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
│   │   ├── auth.service.ts       ← cerveau de l'auth
│   │   ├── auth.interceptor.ts   ← mock HTTP
│   │   ├── auth.guard.ts
│   │   ├── role.guard.ts
│   │   └── auth.resolver.ts
│   └── models/
│       ├── user.model.ts
│       └── auth.model.ts
│
├── features/
│   ├── auth/
│   │   ├── login/
│   │   ├── register/
│   │   └── profile/
│   └── admin/
│
├── shared/
│   └── unauthorized.component.ts
│
├── app.routes.ts
└── app.config.ts

environments/
├── environment.ts       ← useMockApi: true
└── environment.prod.ts  ← useMockApi: false
```

---

## Ordre de construction

1. **Models** — définir les types (`User`, `LoginDto`, `AuthResponse`...)
2. **AuthService** — logique centrale avec Signals
3. **Mock Interceptor** — simuler les appels HTTP
4. **Guards** — protéger les routes
5. **app.config** — tout brancher ensemble
6. **app.routes** — déclarer les routes avec les guards
7. **Pages** — Login, Register, Profile

---

## Ce qui changera quand le back-end arrivera

- ✅ `AuthService` → rien à changer
- ✅ Guards → rien à changer
- ✅ Pages → rien à changer
- 🔧 `environment.ts` → passer `useMockApi` à `false`
- 🔧 Back-end → configurer les cookies HttpOnly + CORS
