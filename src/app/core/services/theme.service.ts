import { DOCUMENT, Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'bl-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private readonly document = inject(DOCUMENT);
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    private readonly _theme = signal<Theme>(this.resolveInitialTheme());

    readonly theme = this._theme.asReadonly();
    readonly isDark = computed(() => this._theme() === 'dark');

    constructor() {
        effect(() => {
            const theme = this._theme();
            // `data-theme` pilote DaisyUI.
            this.document.documentElement.setAttribute('data-theme', theme);
            if (this.isBrowser) {
                try {
                    localStorage.setItem(STORAGE_KEY, theme);
                } catch {
                    /* stockage indisponible : on ignore */
                }
            }
        });
    }

    toggle(): void {
        this._theme.update((current) => (current === 'light' ? 'dark' : 'light'));
    }

    private resolveInitialTheme(): Theme {
        if (!this.isBrowser) {
            // Côté serveur, on rend en clair ; le script inline d'index.html
            // applique le bon thème avant le premier paint côté client.
            return 'light';
        }
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === 'light' || stored === 'dark') {
                return stored;
            }
        } catch {
            /* on retombe sur la préférence système */
        }
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
}
