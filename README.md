# Portfolio - Baptiste Lelièvre

Portfolio one-page bilingue (FR/EN), thème clair/sombre, déployé en continu sur un VPS.

**Stack** : Angular 22 (standalone components, signals, zoneless, control flow, SSR + prerendering), Tailwind CSS 4, DaisyUI 5. Infra : Docker, Nginx, Ansible, GitHub Actions.

> Ce README est le guide de démarrage rapide. Pour l'architecture de déploiement complète, les explications détaillées et les incidents résolus, voir **`DEPLOYMENT.md`**. Pour préparer un serveur neuf, voir **`runbook-vps-ovh-debian.md`**.

## Démarrage

```bash
npm install
npm start          # http://localhost:4200
```

> Node.js >= 22.22.3 (ou >= 24.15) requis par Angular CLI 22.

## Commandes

```bash
npm start              # dev server (environment.development.ts)
npm run build          # build prod + prerender -> dist/
npm test               # tests unitaires
```

## Structure du projet

```
src/app/
├── core/
│   ├── models/         # types stricts (Profile, Experience, PersonalProject, ContactMessage, LocalizedText)
│   ├── data/           # données mockées bilingues + liens de navigation
│   └── services/       # profile, contact, i18n (FR/EN), theme (light/dark) - tous en signals
├── layout/             # navbar (drawer mobile), footer
└── sections/           # hero, experience, projects (carrousel), skills, contact
    └── projects/project-card/   # card enfant (input signal)

public/                 # servis tels quels : llms.txt, ai-context.md, sitemap.xml, robots.txt,
                        # files/cv-baptiste-lelievre.pdf, images/projects/
```

## Configuration (environnements)

`src/environments/environment.ts` et `.development.ts` :

- `isMock` - pilote les **données** (profil, expériences, projets). `true` jusqu'au backend NestJS.
- `contact.isMock` - pilote le **formulaire de contact**. `false` en prod (relais Web3Forms réel), `true` en dev.

Deux drapeaux distincts car les deux préoccupations ont des cycles de vie différents.

## Déploiement

Le déploiement est **continu** : un `git push` sur `main` déclenche GitHub Actions (test -> build image -> push GHCR -> deploy SSH sur le VPS). Rien à lancer manuellement.

L'infrastructure (VPS, Docker, Nginx, TLS, réseau) est gérée séparément par Ansible :

```bash
cd ansible && ansible-playbook site.yml -K
```

Voir `DEPLOYMENT.md` pour le détail.

## Contrat de maintenance

Toute modification de **contenu** met à jour, dans le même commit :

1. les données mockées (`core/data/`)
2. les fichiers IA (`public/llms.txt`, `public/ai-context.md`)
3. le `lastmod` de `public/sitemap.xml`

## Contribuer au backend (à venir)

Le front est prêt à consommer un backend NestJS :

- `GET /api/v1/profile` -> `Profile`
- `GET /api/v1/experiences` -> `Experience[]`
- `GET /api/v1/skills` -> `SkillCategory[]`
- `GET /api/v1/projects` -> `PersonalProject[]`
- `POST /api/v1/contact` -> `202` (avec `{ name, email, message, captchaToken }`)

Passer `isMock` à `false` fera basculer les services sur ces endpoints sans toucher aux composants.
