/** Message du formulaire de contact. Contrat partagé avec le futur POST /contact NestJS. */
export interface ContactMessage {
    readonly name: string;
    readonly email: string;
    readonly message: string;
    /** Jeton hCaptcha/Turnstile - vérifié côté serveur, jamais côté client. */
    readonly captchaToken: string;
}

/** Cycle de vie d'un envoi. */
export type ContactStatus = 'idle' | 'sending' | 'sent' | 'error';
