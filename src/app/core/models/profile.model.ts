/**
 * Modèles de domaine du portfolio.
 * Ces interfaces ont vocation à être partagées (ou dupliquées en DTO)
 * avec le futur backend NestJS.
 */

export const LANGS = ['fr', 'en'] as const;
export type Lang = (typeof LANGS)[number];

/** Texte localisé : une valeur par langue supportée. */
export type LocalizedText = Readonly<Record<Lang, string>>;

export interface SocialLink {
    readonly id: 'github' | 'linkedin' | 'email' | 'cv';
    readonly label: string;
    readonly url: string;
}

export interface Profile {
    readonly name: string;
    /** Intitulé de poste affiché dans le hero. */
    readonly headline: LocalizedText;
    /** Pitch court (2-3 phrases). */
    readonly summary: LocalizedText;
    readonly location: LocalizedText;
    readonly links: readonly SocialLink[];
}

/** Un projet / une mission au sein d'une expérience. */
export interface ExperienceProject {
    readonly title: LocalizedText;
    readonly points: readonly LocalizedText[];
}

export interface Experience {
    readonly id: string;
    readonly role: LocalizedText;
    readonly company: string;
    readonly location: string;
    /** Date ISO (YYYY-MM-DD). */
    readonly startDate: string;
    /** `null` = poste actuel. */
    readonly endDate: string | null;
    readonly projects: readonly ExperienceProject[];
    /** Badges technos / méthodo. */
    readonly tags: readonly string[];
}

export interface SkillCategory {
    readonly id: string;
    readonly label: LocalizedText;
    readonly items: readonly LocalizedText[];
}

export interface PersonalProject {
    readonly id: string;
    readonly name: string;
    readonly kind: 'web' | 'mobile';
    readonly description: LocalizedText;
    readonly tags: readonly string[];
    readonly imageUrl: string;
    readonly repoUrl?: string;
}
