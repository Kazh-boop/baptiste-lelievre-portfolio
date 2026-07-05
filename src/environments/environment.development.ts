/**
 * Environnement de développement (utilisé par `ng serve`).
 */
export const environment = {
  production: false,
  isMock: true,
  apiUrl: 'http://localhost:3000/api/v1',
} as const;
