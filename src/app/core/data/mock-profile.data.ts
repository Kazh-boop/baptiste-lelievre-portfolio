import {
  Experience,
  LocalizedText,
  PersonalProject,
  Profile,
  SkillCategory,
} from '../models/profile.model';

/** Raccourci pour un texte identique dans les deux langues (noms de technos, etc.). */
const same = (value: string): LocalizedText => ({ fr: value, en: value });

export const MOCK_PROFILE: Profile = {
  name: 'Baptiste Lelièvre',
  headline: {
    fr: 'Ingénieur logiciel - Développeur agile (Web, Mobile, Logiciel)',
    en: 'Software Engineer - Agile Developer (Web, Mobile, Software)',
  },
  summary: {
    fr: "Développeur agile avec une forte culture DevOps. Reconnu pour ma rapidité d'apprentissage, je m'adapte facilement à différentes technologies pour répondre précisément aux besoins métiers. Je recherche un poste sur Ajaccio et alentours ou alors en 100% télétravail sur toute la France.",
    en: 'Agile developer with a strong DevOps culture. As a quick learner, I easily adapt to new technologies to precisely meet business requirements. I am currently seeking a position in or around Ajaccio, or a 100% remote role anywhere in France.',
  },
  location: {
    fr: 'Lyon, France - mobilité vers Ajaccio',
    en: 'Lyon, France - open to relocating to Ajaccio',
  },
  links: [
    {
      id: 'github',
      label: 'GitHub',
      url: 'https://github.com/Kazh-boop',
    },
    {
        id: 'linkedin',
        label: 'Linkedin',
        url: 'https://www.linkedin.com/in/baptiste-lelievre-kazh'
    },
    {
        id: 'cv',
        label: 'CV',
        url: '/files/cv_baptiste_lelievre.pdf'
    }
  ],
};

export const MOCK_EXPERIENCES: readonly Experience[] = [
  {
    id: 'sopra-lyon-2025',
    role: { fr: 'Ingénieur logiciel', en: 'Software Engineer' },
    company: 'Sopra Steria',
    location: 'Lyon',
    startDate: '2025-09-01',
    endDate: null,
    projects: [
      {
        title: {
          fr: 'Développement web dans le service public',
          en: 'Web development for the public sector',
        },
        points: [
          { fr: 'Travail en agilité', en: 'Agile way of working' },
          {
            fr: 'Développement front en Vue 2 et Vue 3',
            en: 'Front-end development with Vue 2 and Vue 3',
          },
          {
            fr: 'Développement back en Java 8 et Spring Boot',
            en: 'Back-end development with Java 8 and Spring Boot',
          },
          {
            fr: 'Architecture en microservices',
            en: 'Microservices architecture',
          },
        ],
      },
    ],
    tags: ['Vue 2/3', 'Java 8', 'Spring Boot', 'Microservices', 'Agile'],
  },
  {
    id: 'sopra-chartres-2024',
    role: { fr: 'Ingénieur logiciel', en: 'Software Engineer' },
    company: 'Sopra Steria',
    location: 'Chartres-de-Bretagne',
    startDate: '2024-09-01',
    endDate: '2025-09-01',
    projects: [
      {
        title: {
          fr: "Application web dans le domaine de l'espace",
          en: 'Web application in the space industry',
        },
        points: [
          {
            fr: "Développement front en React avec MUI en partant de zéro, avec utilisation d'une librairie interne",
            en: 'Front-end development from scratch with React and MUI, using an internal component library',
          },
          {
            fr: "Collaboration à distance avec plusieurs membres du projet en France et d'autres entreprises",
            en: 'Remote collaboration with team members across France and partner companies',
          },
          { fr: 'Travail en agilité', en: 'Agile way of working' },
        ],
      },
      {
        title: {
          fr: 'DevSecOps sur site client',
          en: 'DevSecOps at a client site',
        },
        points: [
          { fr: 'Travail en SAFe', en: 'Working within the SAFe framework' },
          {
            fr: 'Collaboration avec une autre entreprise',
            en: 'Collaboration with a partner company',
          },
          {
            fr: "Utilisation d'Ansible et AAP (Ansible Automation Platform)",
            en: 'Use of Ansible and AAP (Ansible Automation Platform)',
          },
        ],
      },
    ],
    tags: ['React', 'MUI', 'SAFe', 'Ansible', 'AAP', 'DevSecOps'],
  },
  {
    id: 'sopra-alternance-2023',
    role: {
      fr: 'Alternance - Développement logiciel',
      en: 'Apprenticeship - Software Development',
    },
    company: 'Sopra Steria',
    location: 'Chartres-de-Bretagne',
    startDate: '2023-08-01',
    endDate: '2024-09-01',
    projects: [
      {
        title: {
          fr: 'Simulation de situation tactique',
          en: 'Tactical situation simulation',
        },
        points: [
          {
            fr: 'Projet de simulation développé en C++ et Lua',
            en: 'Simulation project developed in C++ and Lua',
          },
        ],
      },
    ],
    tags: ['C++', 'Lua', 'Simulation'],
  },
  {
    id: 'sopra-stage-2023',
    role: {
      fr: 'Stage - Développement logiciel',
      en: 'Internship - Software Development',
    },
    company: 'Sopra Steria',
    location: 'Chartres-de-Bretagne',
    startDate: '2023-05-01',
    endDate: '2023-08-01',
    projects: [
      {
        title: { fr: 'Réalité mixte', en: 'Mixed reality' },
        points: [
          {
            fr: 'Projet de réalité mixte développé sur Unity pour les casques HoloLens 2 et Lynx',
            en: 'Mixed reality project built with Unity for HoloLens 2 and Lynx headsets',
          },
        ],
      },
    ],
    tags: ['Unity', 'C#', 'HoloLens 2', 'Lynx', 'XR'],
  },
];

export const MOCK_SKILL_CATEGORIES: readonly SkillCategory[] = [
  {
    id: 'front',
    label: { fr: 'Développement front web', en: 'Front-end web development' },
    items: [
      same('React / MUI'),
      same('Vue 2 / Vue 3 / Vuetify'),
      same('Angular'),
      same('Tailwind CSS'),
    ],
  },
  {
    id: 'back',
    label: {
      fr: 'Développement back / logiciel',
      en: 'Back-end / software development',
    },
    items: [
      same('Java / Spring Boot'),
      same('C++ / Qt'),
      same('C# / Unity'),
      same('Lua'),
      same('NestJS'),
    ],
  },
  {
    id: 'devops',
    label: { fr: 'DevOps', en: 'DevOps' },
    items: [same('Ansible / AAP'), same('Docker')],
  },
  {
    id: 'linux',
    label: { fr: 'Systèmes Linux', en: 'Linux systems' },
    items: [same('Debian / Ubuntu'), same('Bash')],
  },
  {
    id: 'methods',
    label: { fr: 'Méthodologies', en: 'Methodologies' },
    items: [same('Agile / Scrum'), same('SAFe')],
  },
  {
    id: 'languages',
    label: { fr: 'Langues', en: 'Languages' },
    items: [
      { fr: 'Anglais - B2', en: 'English - B2' },
      { fr: 'Allemand - A2', en: 'German - A2' },
      { fr: 'Français - natif', en: 'French - native' },
    ],
  },
];

export const MOCK_PERSONAL_PROJECTS: readonly PersonalProject[] = [
  {
    id: 'portfolio',
    name: 'Portfolio (ce site)',
    kind: 'web',
    description: {
        fr: "One-page Angular SSR bilingue avec thème clair/sombre, données mockées derrière un service prêt pour un backend NestJS. Déployé sur un VPS Debian durci : conteneur Docker construit en multi-stage, Nginx en reverse proxy avec TLS Let's Encrypt, IPv4/IPv6, le tout automatisé par un playbook Ansible idempotent.",
        en: "Bilingual Angular SSR one-page with light/dark theme, mocked data behind a service ready for a NestJS backend. Deployed on a hardened Debian VPS: multi-stage Docker build, Nginx reverse proxy with Let's Encrypt TLS, IPv4/IPv6, all automated with an idempotent Ansible playbook.",
    },
    tags: ['Angular', 'Tailwind CSS', 'DaisyUI', 'SSR', 'Typescript'],
    imageUrl: 'images/projects/portfolio.png'
  },
  {
    id: 'markethopper',
    name: 'MarketHopper',
    kind: 'mobile',
    description: {
        fr: "Application mobile React Native (Expo, TypeScript) qui étend l'utilisation d'Universalis, l'API communautaire des données de marché de Final Fantasy XIV. Elle permet de consulter les prix d'un objet et de les comparer entre tous les serveurs du monde pour trouver où acheter au meilleur prix. Pensée mobile pour les joueurs console : depuis son canapé, manette en main, on vérifie les marchés sur son téléphone facilement",
        en: "React Native mobile app (Expo, TypeScript) extending Universalis, the community API for Final Fantasy XIV market data. It lets you look up an item's prices and compare them across every server worldwide to find the best place to buy. Built mobile-first for console players: from the couch, controller in hand, you can check the markets on your phone easily",
    },
    tags: ['React Native', 'Expo', 'TypeScript'],
    imageUrl: 'images/projects/marketHopper.png',
    repoUrl: 'https://github.com/Kazh-boop/MarketHopper',
  },
];
