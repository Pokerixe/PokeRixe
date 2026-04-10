# 🎮 PokéRixe — Front-End

Interface web du projet **PokéRixe**, un jeu de combat de créatures au tour par tour en JCJ (Joueur contre Joueur).

Site web toujours en développement : ``pokerixe.baptouk.live/``

Documentation technique : ``baptouk.github.io/PokeRixe/``

Sonar Test : 
[![Quality Gate Status](https://sonar.baptouk.live/api/project_badges/measure?project=PokeRixe-front&metric=alert_status&token=sqb_ad8cebf443af13e1b57178c64191711439729c63)](https://sonar.baptouk.live/dashboard?id=PokeRixe-front)
[![Coverage](https://sonar.baptouk.live/api/project_badges/measure?project=PokeRixe-front&metric=coverage&token=sqb_ad8cebf443af13e1b57178c64191711439729c63)](https://sonar.baptouk.live/dashboard?id=PokeRixe-front) 

> Le front-end communiqueras avec le back-end via une **API REST** (Java Spring).
---

## 📋 Fonctionnalités

- [x] Consultation du Pokédex (avec filtre par type)
- [x] Consultation de chaque créature
- [x] Attaques disponibles pour chaque pokémon
- [x] Connexion / Inscription utilisateur
- [x] Gestion d'équipe (slots, mouvements, ordre)
- [x] Recherche et rejoindre une partie
- [x] CRUD complet des équipes (interface front non finalisée)
- [x] Interface de combat interactive
---

## 🏗️ Stack technique

| Technologie | Version | Usage |
|---|---|---|
| [Angular](https://angular.io/) | 21 | Framework front-end |
| TypeScript | ~5.9 | Langage principal |
| CSS custom | — | Styles (responsive mobile inclus) |
| [ECharts](https://echarts.apache.org/) + [ngx-echarts](https://xieziyu.github.io/ngx-echarts/) | 6 / 21 | Graphiques de statistiques |
| [RxJS](https://rxjs.dev/) | ~7.8 | Gestion des flux asynchrones |
| [Vitest](https://vitest.dev/) | — | Tests unitaires |
| [Compodoc](https://compodoc.app/) | ^1.2 | Documentation du code |
| [SonarQube](https://www.sonarsource.com/products/sonarqube/) | — | Qualité du code |
| [GitHub Actions](https://github.com/features/actions) | — | CI/CD |
| [Prettier](https://prettier.io/) | — | Formatage du code |

---

## 🚀 Installation et démarrage

### Prérequis

- [Node.js](https://nodejs.org/) >= 18
- [npm](https://www.npmjs.com/) `11.6.2` (version fixée via `packageManager`)
- [Angular CLI](https://angular.io/cli) `^21`

```bash
npm install -g @angular/cli
```

### Cloner le dépôt

```bash
git clone https://github.com/BaptouK/pokerixe-frontend.git
cd pokerixe-frontend
```

### Installer les dépendances

```bash
npm install
```

### Lancer en développement

```bash
npm start
# ou
ng serve
```

L'application sera disponible sur [http://localhost:4200](http://localhost:4200).

### Build de production

```bash
npm run build
```

Les fichiers compilés se trouvent dans le dossier `dist/`.


---

## 📁 Structure du projet

```
src/
└── app/
    ├── core/
    │   ├── interceptors/       # Intercepteurs HTTP (auth, erreurs...)
    │   └── store/              # Gestion d'état global
    │
    ├── pages/                  # Pages principales de l'application
    │   ├── equipes/            # Gestion des équipes du joueur
    │   ├── fight/              # Interface de combat JCJ
    │   ├── home/               # Page d'accueil
    │   ├── pokedex/            # Liste des créatures
    │   └── pokemon/            # Fiche détaillée d'une créature
    │
    └── shared/                 # Éléments réutilisables
        ├── components/
        │   ├── card/           # Carte créature
        │   ├── header/         # En-tête global
        │   ├── progress-bar/   # Barre de progression (HP, stats...)
        │   ├── star-stats/     # Affichage stats en étoiles
        │   ├── stats/          # Bloc statistiques (ECharts)
        │   └── type/           # Badge de type de créature
        ├── mappers/            # Transformation API → modèle interne
        ├── models/
        │   └── dto/            # Types des réponses API
        ├── repositories/       # Couche d'accès aux données (appels HTTP)
        └── services/           # Logique métier partagée
```

---

## 🧪 Tests unitaires

Les tests sont exécutés avec **Vitest** via le builder Angular.

```bash
npm test
```

### Couverture des services core

| Service | Tests | Description |
|---|---|---|
| `AuthService` | 11 | Login, register, logout, loadCurrentUser, gestion des signaux |
| `GameService` | 8 | Chargement, création, rejoindre et quitter une partie |
| `TeamService` | 19 | Slots, mouvements, firstPokemon, saveTeam, resetTeam |

Les tests utilisent `HttpTestingController` pour simuler les appels HTTP et vérifient le comportement des signaux Angular (`signal()`, `computed()`).

---

## 📊 Qualité du code — SonarQube

L'analyse qualité est déclenchée automatiquement via la CI/CD à chaque push.

Pour lancer une analyse manuellement :

```bash
npm run sonar
```

> Requiert un fichier `sonar-project.properties` à la racine avec la configuration du projet, et de avoir un server soanrQube dédié.

Exemple de `sonar-project.properties` :

```properties
sonar.projectKey=pokerixe-frontend
sonar.sources=src
sonar.host.url=http://<sonarqube-url>
sonar.login=<token>
```

Exemple de `docker-compose.yml` pour SonarQube local :

```yaml
services:
  sonarqube:
    image: sonarqube:community
    ports:
      - "9000:9000"
    environment:
      SONAR_ES_BOOTSTRAP_CHECKS_DISABLE: "true"
    volumes:
      - sonarqube_data:/opt/sonarqube/data
      - sonarqube_extensions:/opt/sonarqube/extensions
      - sonarqube_logs:/opt/sonarqube/logs

volumes:
  sonarqube_data:
  sonarqube_extensions:
  sonarqube_logs:
```
---

## 📚 Documentation — Compodoc

La documentation est générée automatiquement à partir des commentaires du code source.

```bash
# Générer et servir la documentation
npm run doc
```

La documentation sera accessible sur [http://localhost:8080](http://localhost:8080).

## 🔄 CI/CD — GitHub Actions

Les pipelines sont définis dans `.github/workflows/` et s'exécutent automatiquement à chaque push sur `main`.

### `ci.yml` — Analyse qualité
1. **Checkout** — récupération du code avec tout l'historique Git (nécessaire pour SonarQube)
2. **Analyse SonarQube** — scan statique du code TypeScript/HTML et envoi du rapport sur le serveur SonarQube

### `deploy.yml` — Déploiement en production
1. **Build Docker** — construction de l'image taguée avec la version et `:latest`
2. **Push GHCR** — publication de l'image sur `ghcr.io/baptouk/pokerixe-front:latest`
3. **Déploiement SSH** — connexion au serveur perso, redémarrage du container Docker pour mettre le site à jour

### `docs.yml` — Documentation
1. **Génération Compodoc** — génération de la documentation à partir du code source
2. **Déploiement GitHub Pages** — publication automatique sur GitHub Pages

---

## 📄 Licence

Usage interne — projet scolaire.
