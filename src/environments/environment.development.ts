/**
 * Environnement de développement (utilisé par `ng serve`).
 */
export const environment = {
    production: false,
    isMock: true,
    apiUrl: 'http://localhost:3000/api/v1',
    contact: {
        isMock: true,
        // Relais intérimaire Web3Forms — sera remplacé par `${apiUrl}/contact` (NestJS).
        endpoint: 'https://api.web3forms.com/submit',
        // Clé d'accès Web3Forms : PUBLIQUE par conception (elle identifie ta boîte,
        // elle n'authentifie rien — le secret reste chez le relais).
        accessKey: '12408fbc-cd71-4d98-b032-f0bf497c51f3',
        // Sitekey hCaptcha fournie par Web3Forms (voir leur doc "hCaptcha") — publique aussi.
        hcaptchaSiteKey: '50b2fe65-b00b-4b9e-ad62-3ba471098be2',
    }
} as const;
