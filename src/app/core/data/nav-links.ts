import { UiKey } from '../services/i18n.service';

export interface NavLink {
    readonly fragment: string;
    readonly labelKey: UiKey;
}

/** Ancres de la one-page, partagées entre la navbar et le drawer mobile. */
export const NAV_LINKS: readonly NavLink[] = [
    { fragment: 'experience', labelKey: 'nav.experience' },
    { fragment: 'skills', labelKey: 'nav.skills' },
    { fragment: 'projects', labelKey: 'nav.projects' },
    { fragment: 'contact', labelKey: 'nav.contact' },
];
