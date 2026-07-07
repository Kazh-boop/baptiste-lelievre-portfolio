import { DOCUMENT, Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LANGS, Lang, LocalizedText } from '../models/profile.model';

const STORAGE_KEY = 'bl-lang';

/** Dictionnaire des libellés d'interface (le contenu métier est localisé dans les données). */
const UI = {
    fr: {
        'nav.experience': 'Expériences',
        'nav.skills': 'Compétences',
        'nav.projects': 'Projets',
        'nav.contact': 'Contact',
        'nav.openMenu': 'Ouvrir le menu',
        'nav.closeMenu': 'Fermer le menu',
        'hero.hello': 'Bonjour, je suis',
        'hero.cta': 'Voir mon parcours',
        'hero.github': 'Mon GitHub',
        'hero.linkedin': 'Mon Linkedin',
        'hero.cv': 'Voir mon CV',
        'experience.title': 'Expériences professionnelles',
        'experience.present': "Aujourd'hui",
        'projects.title': 'Projets personnels',
        'projects.viewCode': 'Voir le code',
        'projects.visit': 'Visiter',
        'projects.less': 'Réduire',
        'projects.more': 'Plus d\'infos',
        'skills.title': 'Compétences',
        'footer.builtWith': 'Construit avec Angular, Tailwind CSS et DaisyUI',
        'footer.aiFile': 'Contexte pour les IA',
        'theme.toggle': 'Basculer le thème clair/sombre',
        'lang.toggle': 'Switch to English',
        'contact.title': 'Me contacter',
        'contact.subtitle': 'Un poste, une mission, une question ? Écrivez-moi.',
        'contact.name': 'Nom',
        'contact.email': 'Email',
        'contact.message': 'Message',
        'contact.send': 'Envoyer',
        'contact.sending': 'Envoi en cours…',
        'contact.retry': 'Réessayer',
        'contact.success': 'Message envoyé, merci ! Je vous répondrai rapidement.',
        'contact.error': "L'envoi a échoué. Vérifiez votre connexion et réessayez.",
        'contact.err.name': 'Votre nom est requis.',
        'contact.err.email': 'Une adresse email valide est requise.',
        'contact.err.message': 'Un message est requis.',
        'contact.err.messageMin': 'Votre message est un peu court (10 caractères minimum).',
        'contact.err.captcha': 'Merci de valider le captcha avant d\'envoyer.',
    },
    en: {
        'nav.experience': 'Experience',
        'nav.skills': 'Skills',
        'nav.projects': 'Projects',
        'nav.contact': 'Contact',
        'nav.openMenu': 'Open menu',
        'nav.closeMenu': 'Close menu',
        'hero.hello': "Hi, I'm",
        'hero.cta': 'See my journey',
        'hero.github': 'My GitHub',
        'hero.linkedin': 'My Linkedin',
        'hero.cv': 'View my resume',
        'experience.title': 'Work experience',
        'experience.present': 'Present',
        'projects.title': 'Personal projects',
        'projects.viewCode': 'View code',
        'projects.visit': 'Visit',
        'projects.less': 'Show less',
        'projects.more': 'More info',
        'skills.title': 'Skills',
        'footer.builtWith': 'Built with Angular, Tailwind CSS and DaisyUI',
        'footer.aiFile': 'AI context file',
        'theme.toggle': 'Toggle light/dark theme',
        'lang.toggle': 'Passer en français',
        'contact.title': 'Get in touch',
        'contact.subtitle': 'A position, a mission, a question? Drop me a line.',
        'contact.name': 'Name',
        'contact.email': 'Email',
        'contact.message': 'Message',
        'contact.send': 'Send',
        'contact.sending': 'Sending…',
        'contact.retry': 'Try again',
        'contact.success': "Message sent, thank you! I'll get back to you shortly.",
        'contact.error': 'Sending failed. Check your connection and try again.',
        'contact.err.name': 'Your name is required.',
        'contact.err.email': 'A valid email address is required.',
        'contact.err.message': 'A message is required.',
        'contact.err.messageMin': 'Your message is a bit short (10 characters minimum).',
        'contact.err.captcha': 'Please complete the captcha before sending.',
    },
} as const satisfies Record<Lang, Record<string, string>>;

export type UiKey = keyof (typeof UI)['fr'];

@Injectable({ providedIn: 'root' })
export class I18nService {
    private readonly document = inject(DOCUMENT);
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    private readonly _lang = signal<Lang>(this.resolveInitialLang());

    /** Langue courante (signal en lecture seule). */
    readonly lang = this._lang.asReadonly();

    constructor() {
        effect(() => {
            const lang = this._lang();
            this.document.documentElement.lang = lang;
            if (this.isBrowser) {
                try {
                    localStorage.setItem(STORAGE_KEY, lang);
                } catch {
                    /* stockage indisponible (navigation privée, etc.) : on ignore */
                }
            }
        });
    }

    toggle(): void {
        this._lang.update((current) => (current === 'fr' ? 'en' : 'fr'));
    }

    /** Traduit une clé d'interface. */
    t(key: UiKey): string {
        return UI[this._lang()][key];
    }

    /** Sélectionne la bonne variante d'un texte localisé issu des données. */
    pick(text: LocalizedText): string {
        return text[this._lang()];
    }

    /** Formate une période "sept. 2024 – sept. 2025" selon la langue courante. */
    formatPeriod(startDate: string, endDate: string | null): string {
        const fmt = new Intl.DateTimeFormat(this._lang() === 'fr' ? 'fr-FR' : 'en-US', {
            month: 'short',
            year: 'numeric',
        });
        const start = fmt.format(new Date(startDate));
        const end = endDate ? fmt.format(new Date(endDate)) : this.t('experience.present');
        return `${start} - ${end}`;
    }

    private resolveInitialLang(): Lang {
        if (!this.isBrowser) {
            return 'fr';
        }
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored && (LANGS as readonly string[]).includes(stored)) {
                return stored as Lang;
            }
        } catch {
            /* on retombe sur la détection navigateur */
        }
        return navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en';
    }
}
