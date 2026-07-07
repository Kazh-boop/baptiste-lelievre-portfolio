/**
 * Environnement de production.
 * `isMock = true` tant que le backend NestJS n'est pas branché.
 * Passer à `false` fera basculer ProfileService sur les appels HTTP.
 */
export const environment = {
  production: true,
  isMock: true,
  apiUrl: 'https://api.baptiste-lelievre.fr/api/v1',
  contact: {
    // Relais intérimaire Web3Forms — sera remplacé par `${apiUrl}/contact` (NestJS).
    endpoint: 'https://api.web3forms.com/submit',
    // Clé d'accès Web3Forms : PUBLIQUE par conception (elle identifie ta boîte,
    // elle n'authentifie rien — le secret reste chez le relais).
    accessKey: 'REMPLACE_MOI',
    // Sitekey hCaptcha fournie par Web3Forms (voir leur doc "hCaptcha") — publique aussi.
    hcaptchaSiteKey: '50b2fe65-b00b-4b9e-ad62-3ba471098be2',
  },
} as const;
