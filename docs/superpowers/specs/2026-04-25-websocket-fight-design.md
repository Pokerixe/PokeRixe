# Design — Remplacement du polling HTTP par WebSocket (combat)

**Date :** 2026-04-25  
**Statut :** Approuvé

---

## Contexte

Le `FightService` actuel utilise du short polling HTTP (`GET /games/:id/state` toutes les 1,5 s) pour synchroniser l'état du combat. Les actions (attaque, switch) passent par `POST /games/:id/action`.

L'objectif est de remplacer ce mécanisme par une connexion **WebSocket persistante** avec encodage **MessagePack** (binaire), pour un échange temps réel bidirectionnel dès la création ou le rejoint d'une partie.

---

## Périmètre

- **Inclus :** page `/fight` (combat + attente adversaire + reconnexion), page `/search-game` (ouverture de la socket après create/join), protocole de messages client↔serveur.
- **Exclu :** la liste des parties disponibles sur `/search-game` reste en HTTP polling. Le backend Spring est hors scope — ce design définit le protocole que le backend devra respecter.

---

## Architecture générale

```
SearchGame page
    │  HTTP POST create/join (inchangé)
    ▼
FightWsService.connect(gameId)
    │  WebSocket native (binaryType: 'arraybuffer')
    │  encode/decode via @msgpack/msgpack
    ▼
Fight page ──reads── Signals (phase, playerActive, log, ...)
    │
    └─ onMoveClick / onSwitch → FightWsService.send(message)
```

**Nginx reverse proxy :** toute requête dont le chemin commence par `/api` est routée vers le backend Spring. L'URL WebSocket commence par `/api`, elle est donc automatiquement proxifiée sans configuration Angular particulière.

---

## Protocole de messages

### URL de connexion

```
ws(s)://<host>/api/games/:id/ws
```

Le protocole (`ws` ou `wss`) est dérivé dynamiquement depuis `window.location.protocol`. Le `gameId` est dans l'URL — le serveur identifie la partie sans message d'initialisation. L'authentification se fait via le cookie HttpOnly existant, transmis automatiquement lors du handshake WebSocket.

### Client → Serveur

```typescript
// Attaque
{ type: 'attack',
  moveSlot: number,    // index du move choisi (0-3)
  pokemonSlot: number  // index du Pokémon attaquant dans l'équipe
}

// Switch
{ type: 'switch',
  switchToSlotIndex: number }
```

Le backend résout lui-même les stats, types et puissance d'attaque depuis sa base de données — le client n'envoie que les identifiants nécessaires à la résolution du tour.

### Serveur → Client

| Message | Déclencheur |
|---|---|
| `{ type: 'waiting_opponent' }` | Connexion du créateur, adversaire pas encore arrivé |
| `{ type: 'full_state', payload: FightState }` | Connexion, reconnexion, ou après chaque résolution de tour |
| `{ type: 'error', message: string }` | Action refusée ou erreur serveur |

Le serveur envoie toujours le **`FightState` complet** (y compris les logs depuis le début du combat). Pas de delta — simplifie les deux côtés, taille acceptable pour des combats Pokémon.

---

## Conception du service

### Classe abstraite

```typescript
// src/app/core/fight/fight-ws.service.ts
abstract class FightWsService {
  abstract readonly phase: Signal<FightPhase | null>;
  abstract readonly playerActivePokemon: Signal<FightPokemonState | null>;
  abstract readonly opponentActivePokemon: Signal<FightPokemonState | null>;
  abstract readonly playerTeam: Signal<FightPokemonState[]>;
  abstract readonly playerHasActed: Signal<boolean>;
  abstract readonly mustSwitch: Signal<boolean>;
  abstract readonly log: Signal<TurnEvent[]>;
  abstract readonly winner: Signal<string | null>;
  abstract readonly isFinished: Signal<boolean>;
  abstract readonly error: Signal<string | null>;
  abstract readonly connectionStatus: Signal<'connecting' | 'waiting_opponent' | 'in_fight' | 'disconnected'>;
  abstract readonly opponentName: Signal<string>;
  abstract readonly playerName: Signal<string>;
  abstract readonly opponentRemainingCount: Signal<number>;
  abstract readonly isPendingAction: Signal<boolean>;

  abstract connect(gameId: number): void;
  abstract isConnected(gameId: number): boolean;
  abstract sendAttack(moveSlot: number, pokemonSlot: number): void;
  abstract sendSwitch(slotIndex: number): void;
  abstract reset(): void;
}
```

### Implémentation réelle — `FightWsServiceImpl`

- Ouvre une `WebSocket` native avec `binaryType = 'arraybuffer'`
- Encode les messages sortants via `msgpack.encode()`
- Décode les messages entrants via `msgpack.decode()` et dispatche selon `type`
- Construit l'URL dynamiquement : `${ws|wss}://${window.location.host}/api/games/${gameId}/ws`
- `sendAttack` et `sendSwitch` passent `isPendingAction` à `true` avant d'envoyer le message
- `isPendingAction` repasse à `false` à la réception d'un `full_state` ou d'un `error`

### Mock de développement — `FightWsMockService`

- Implémente la même classe abstraite
- Simule les messages serveur via des `setTimeout` avec des données hardcodées
- Couvre tous les états : `waiting_opponent` → tour par tour → K.O. → `finished`
- Aucune WebSocket réelle ouverte

### Injection selon l'environnement

Dans `app.config.ts` :

```typescript
{
  provide: FightWsService,
  useClass: environment.useMockApi ? FightWsMockService : FightWsServiceImpl
}
```

---

## Changements sur les composants

### `search-game.ts`

Appel à `FightWsService.connect(gameId)` **avant** la navigation vers `/fight/:id`, dans les callbacks `createGame` et `joinGame` :

```typescript
next: (game) => {
  this.fightWsService.connect(game.id);
  this.router.navigate(['/fight', game.id]);
}
```

### `fight.ts`

| Avant | Après |
|---|---|
| `inject(FightService)` | `inject(FightWsService)` |
| `fightService.startPolling(gameId)` | Supprimé |
| `fightService.sendAttack(gameId, move, stats, types)` | `fightWsService.sendAttack(moveSlot, pokemonSlot)` |
| `fightService.reset()` dans `ngOnDestroy` | `fightWsService.reset()` |

**Fallback reconnexion** dans le constructeur :

```typescript
constructor() {
  if (!this.fightWsService.isConnected(this.gameId)) {
    this.fightWsService.connect(this.gameId);
  }
}
```

**Nouvel affichage selon `connectionStatus` :**

| Valeur | Écran affiché |
|---|---|
| `'connecting'` | Spinner de connexion |
| `'waiting_opponent'` | Écran d'attente adversaire (nouveau bloc dans `fight.html`) |
| `'in_fight'` | Interface de combat existante |
| `'disconnected'` | Message d'erreur + bouton "Retenter" |

**Freeze de l'UI pendant l'attente serveur (`isPendingAction`) :**

Quand `isPendingAction()` est `true`, tous les boutons d'action (attaques et switch) sont désactivés via `[disabled]="fightWsService.isPendingAction()"`. Un indicateur visuel (spinner ou opacité réduite) signale à l'utilisateur que sa commande est en cours de traitement. Les inputs sont réactivés dès réception du `full_state` ou d'un `error` du serveur.

---

## Reconnexion et gestion des erreurs

### Reconnexion automatique

En cas de fermeture inattendue de la socket, `FightWsServiceImpl` tente de se reconnecter avec backoff exponentiel :

- Tentative 1 : après 1 s
- Tentative 2 : après 2 s
- Tentative 3 : après 4 s
- Abandon après 3 tentatives → `connectionStatus = 'disconnected'`

Sur reconnexion réussie, le serveur envoie un `full_state` complet. Le client remplace son état local entièrement.

### Fermeture propre

Quand le combat se termine (`phase === 'finished'`), le serveur ferme la socket avec le code WebSocket `1000`. Le service détecte ce code et **n'initie pas de reconnexion**.

### Tableau de gestion des erreurs

| Situation | Comportement |
|---|---|
| Message `error` du serveur | Signal `error` mis à jour, `isPendingAction = false`, affiché dans l'UI |
| Socket fermée proprement (code 1000) | `reset()`, pas de reconnexion |
| Socket fermée inopinément | Backoff 1s/2s/4s, puis `disconnected` ; `isPendingAction` remis à `false` |
| 3 tentatives échouées | `connectionStatus = 'disconnected'`, bouton "Retenter" |

---

## Fichiers concernés

### À créer

| Fichier | Contenu |
|---|---|
| `src/app/core/fight/fight-ws.model.ts` | Types des messages client↔serveur (`ClientMessage`, `ServerMessage`) |
| `src/app/core/fight/fight-ws.service.ts` | Classe abstraite `FightWsService` |
| `src/app/core/fight/fight-ws-impl.service.ts` | `FightWsServiceImpl` (WebSocket natif + msgpack) |
| `src/app/core/fight/fight-ws-mock.service.ts` | `FightWsMockService` (simulation locale) |
| `src/app/core/fight/fight-ws.service.spec.ts` | Tests de l'implémentation réelle |
| `src/app/core/fight/fight-ws-mock.service.spec.ts` | Tests du mock |

### À modifier

| Fichier | Changement |
|---|---|
| `src/app/core/fight/fight.model.ts` | Inchangé (types FightState, FightPhase, etc. réutilisés) |
| `src/app/pages/fight/fight.ts` | Injection de `FightWsService`, suppression du polling |
| `src/app/pages/fight/fight.html` | Ajout de l'écran d'attente adversaire, de l'écran déconnecté, et du `[disabled]` sur les boutons d'action |
| `src/app/pages/fight/fight.spec.ts` | Réécriture avec `FightWsMockService` |
| `src/app/pages/search-game/search-game.ts` | Appel à `connect()` avant navigation |
| `src/app/pages/search-game/search-game.spec.ts` | Vérification de l'appel à `connect()` |
| `src/app/app.config.ts` | Ajout du provider `FightWsService` |
| `src/environments/environment.ts` | Aucun changement (wsUrl dérivé dynamiquement) |

### À supprimer

| Fichier | Raison |
|---|---|
| `src/app/core/fight/fight.service.ts` | Remplacé par `FightWsServiceImpl` |
| `src/app/core/fight/fight.service.spec.ts` | Remplacé par `fight-ws.service.spec.ts` |

---

## Tests

| Fichier | Ce qu'on teste |
|---|---|
| `fight-ws.service.spec.ts` | Décodage msgpack, dispatch vers signals, reconnexion, fermeture propre (code 1000), `isPendingAction` vrai après envoi et faux après `full_state`/`error` |
| `fight-ws-mock.service.spec.ts` | Simulation correcte des phases waiting → in_fight → finished, freeze entre envoi et réponse |
| `fight.spec.ts` | Réaction de la page aux 4 états de `connectionStatus` ; boutons désactivés quand `isPendingAction` est vrai |
| `search-game.spec.ts` | `connect()` appelé avant navigation dans create et join |

**Stratégie :** `vi.stubGlobal('WebSocket', MockWs)` — le test injecte un faux WebSocket global exposant une méthode `simulateMessage(ArrayBuffer)` pour déclencher des messages msgpack encodés et vérifier les signals resultants.
