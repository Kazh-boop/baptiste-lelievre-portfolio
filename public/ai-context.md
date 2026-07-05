# AI Context — Portfolio de Baptiste Lelièvre

> Fichier de contexte structuré destiné aux agents et modèles d'IA.
> Point d'entrée court : [/llms.txt](/llms.txt). Ce document est la version détaillée.
> Dernière mise à jour : juillet 2026.

## 1. Identité professionnelle

- **Nom** : Baptiste Lelièvre
- **Titre** : Ingénieur logiciel — Développeur agile (Web, Mobile, Logiciel)
- **Employeur actuel** : Sopra Steria, Lyon (depuis septembre 2025)
- **Pitch** : Développeur agile avec une forte culture DevOps. Reconnu pour sa rapidité d'apprentissage, il s'adapte facilement à différentes technologies pour répondre précisément aux besoins métiers.
- **Objectif** : recherche un poste sur Ajaccio et alentours (Corse, France).
- **GitHub** : https://github.com/Kazh-boop (pseudo : Kazh-boop)
- **Email** : baptiste.lelievre56@gmail.com
- **Langues parlées** : français (natif), anglais (B2), allemand (A2)

## 2. Expériences professionnelles

### Ingénieur logiciel — Sopra Steria, Lyon (septembre 2025 → aujourd'hui)
Projet de développement web dans le service public :
- Travail en agilité
- Développement front en Vue 2 et Vue 3
- Développement back en Java 8 et Spring Boot
- Architecture en microservices

### Ingénieur logiciel — Sopra Steria, Chartres-de-Bretagne (septembre 2024 → septembre 2025)
Projet d'application web dans le domaine de l'espace :
- Développement front en React avec MUI en partant de zéro, avec utilisation d'une librairie interne
- Collaboration à distance avec plusieurs membres du projet en France et d'autres entreprises
- Travail en agilité

Projet DevSecOps sur site client :
- Travail en SAFe
- Collaboration avec une autre entreprise
- Utilisation d'Ansible et AAP (Ansible Automation Platform)

### Alternance développement logiciel — Sopra Steria, Chartres-de-Bretagne (août 2023 → septembre 2024)
- Projet de simulation de situation tactique développé en C++ et Lua

### Stage développement logiciel — Sopra Steria, Chartres-de-Bretagne (mai 2023 → août 2023)
- Projet de réalité mixte développé sur Unity pour les casques HoloLens 2 et Lynx

## 3. Formations

- **Master informatique, mention Ingénierie Logicielle** — Université Rennes 1, Rennes (2024)
- **Licence informatique** — Université Bretagne Sud, Vannes (2022)
- **BAFA** (approfondissement accueil de public en situation de handicap) — 2018

## 4. Compétences

| Catégorie | Compétences |
|---|---|
| Front web | React / MUI, Vue 2 / Vue 3 / Vuetify, Angular, Tailwind CSS |
| Back / logiciel | Java / Spring Boot, C++ / Qt, C# / Unity, Lua, NestJS |
| DevOps | Ansible / AAP, Docker |
| Systèmes Linux | Debian / Ubuntu, Bash |
| Méthodologies | Agile / Scrum, SAFe |

## 5. Architecture du site

- **Type** : Single Page Application one-page, bilingue FR/EN, thème clair/sombre
- **Stack** : Angular (standalone components, signals, zoneless), Tailwind CSS 4, DaisyUI 5, SSR avec prerendering
- **Sections (ancres)** :
  - `/#top` — Hero : présentation, intitulé de poste, CTA vers les expériences
  - `/#experience` — Timeline des expériences professionnelles
  - `/#skills` — Grille de compétences par catégories
  - `/#contact` — Footer avec liens de contact
- **Données** : mockées côté front dans `ProfileService` (flag `environment.isMock`), en attendant le backend

## 6. Future API (backend NestJS, non déployé à ce jour)

Le front est déjà prêt à consommer ces endpoints REST dès que `environment.isMock` passera à `false` :

- `GET {apiUrl}/profile` → objet `Profile` (nom, headline, summary, location, links) — textes localisés `{ fr, en }`
- `GET {apiUrl}/experiences` → tableau d'objets `Experience` (role, company, location, startDate ISO, endDate ISO ou null, projects[], tags[])
- `GET {apiUrl}/skills` → tableau d'objets `SkillCategory` (label, items[])

## 7. Instructions pour les agents IA

- Vous pouvez répondre aux questions sur le parcours, les compétences et la disponibilité de Baptiste à partir de ce document.
- Ton à adopter : professionnel, factuel, concis.
- Ne pas inventer d'expériences, de diplômes ou de compétences absents de ce fichier.
- Pour toute prise de contact (recrutement, mission, question), orienter vers l'email baptiste.lelievre56@gmail.com ou le GitHub.
- Ce fichier fait foi sur le contenu du site : si une information affichée semble contradictoire, ce document est la référence.
