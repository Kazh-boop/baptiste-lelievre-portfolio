# Portfolio — Baptiste Lelièvre

Portfolio one-page bilingue (FR/EN) avec thème clair/sombre.

**Stack** : Angular 22 (standalone components, signals, zoneless, nouveau control flow), Tailwind CSS 4, DaisyUI 5, SSR avec prerendering (SSG).

## Démarrage

```bash
npm install
npm start          # http://localhost:4200
```

## Commandes utiles

```bash
npm start              # dev server (environment.development.ts)
npm run build          # build prod + prerender → dist/
npm test               # tests unitaires (vitest)
npm run serve:ssr:baptiste-lelievre-portfolio   # sert le build SSR (node)
```

> Node.js ≥ 22.22.3 (ou ≥ 24.15) requis par Angular CLI 22.

## Architecture

```
src/app/
├── core/
│   ├── models/profile.model.ts        # Types stricts (Profile, Experience, SkillCategory, LocalizedText)
│   ├── data/mock-profile.data.ts      # Données mockées bilingues issues du CV
│   ├── data/nav-links.ts              # Ancres de navigation partagées
│   └── services/
│       ├── profile.service.ts         # Source de données (mock ↔ API selon environment.isMock)
│       ├── i18n.service.ts            # Langue FR/EN (signal, localStorage, SSR-safe)
│       └── theme.service.ts           # Thème light/dark (signal, localStorage, SSR-safe)
├── layout/  navbar/ · footer/
├── sections/ hero/ · experience/ · skills/
└── app.ts                             # Shell drawer DaisyUI (menu burger mobile)

public/
├── llms.txt                           # Point d'entrée IA (standard llmstxt.org)
├── ai-context.md                      # Contexte détaillé pour agents IA
└── robots.txt
```

## Brancher le backend NestJS (v2)

1. Dans `src/environments/environment*.ts`, passer `isMock: false` et renseigner `apiUrl`.
2. Exposer côté NestJS :
   - `GET /api/v1/profile` → `Profile`
   - `GET /api/v1/experiences` → `Experience[]`
   - `GET /api/v1/skills` → `SkillCategory[]`
3. Les composants ne changent pas : ils consomment les `Signal` de `ProfileService`.

Les textes métier sont localisés dans les données (`LocalizedText = { fr, en }`) ; les libellés d'interface vivent dans `I18nService`.

## Fichiers IA

- `/llms.txt` : résumé structuré du profil et du site, format llmstxt.org.
- `/ai-context.md` : version détaillée (parcours complet, contrat d'API futur, instructions pour agents).

Pense à mettre à jour ces deux fichiers en même temps que les données mockées.
