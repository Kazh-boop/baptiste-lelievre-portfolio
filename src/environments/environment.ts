/**
 * Environnement de production.
 * `isMock = true` tant que le backend NestJS n'est pas branché.
 * Passer à `false` fera basculer ProfileService sur les appels HTTP.
 */
export const environment = {
  production: true,
  isMock: true,
  apiUrl: 'https://api.baptiste-lelievre.fr/api/v1',
} as const;
