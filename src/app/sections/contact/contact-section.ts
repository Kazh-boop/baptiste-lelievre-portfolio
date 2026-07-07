import {
    ChangeDetectionStrategy, Component, DOCUMENT, ElementRef,
    afterNextRender, inject, signal, viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { ContactService } from '../../core/services/contact.service';
import { I18nService } from '../../core/services/i18n.service';

/** API globale minimale d'hCaptcha (script tiers). */
declare global {
    interface Window {
        hcaptcha?: {
            render(el: HTMLElement, params: Record<string, unknown>): string;
            reset(widgetId: string): void;
        };
    }
}

@Component({
    selector: 'app-contact-section',
    imports: [ReactiveFormsModule],
    templateUrl: './contact-section.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSection {
    protected readonly i18n = inject(I18nService);
    private readonly contact = inject(ContactService);
    private readonly document = inject(DOCUMENT);

    protected readonly status = this.contact.status;

    private readonly captchaHost =
        viewChild.required<ElementRef<HTMLDivElement>>('captchaHost');

    /** Jeton hCaptcha courant (null tant que le défi n'est pas résolu). */
    protected readonly captchaToken = signal<string | null>(null);
    /** L'utilisateur a soumis sans captcha → on affiche l'aide. */
    protected readonly captchaMissing = signal(false);

    private captchaWidgetId: string | null = null;
    /** Horodatage d'affichage : une soumission < 3 s = bot. */
    private readonly renderedAt = Date.now();

    protected readonly form = new FormGroup({
        name: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.maxLength(100)],
        }),
        email: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.email],
        }),
        message: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.minLength(10), Validators.maxLength(2000)],
        }),
        /** Honeypot : invisible pour un humain, irrésistible pour un bot. */
        botcheck: new FormControl('', { nonNullable: true }),
    });

    constructor() {
        // afterNextRender = navigateur uniquement : jamais exécuté par le SSR.
        afterNextRender(() => this.loadCaptchaWhenVisible());
    }

    protected async onSubmit(): Promise<void> {
        this.form.markAllAsTouched();
        if (this.form.invalid || this.status() === 'sending') {
            return;
        }

        const value = this.form.getRawValue();

        // Défenses anti-bot passives : on fait SEMBLANT d'accepter.
        const isBot = value.botcheck !== '' || Date.now() - this.renderedAt < 3000;
        if (isBot) {
            await this.contact.simulateSuccess();
            return;
        }

        const token = this.captchaToken();
        if (!token) {
            this.captchaMissing.set(true);
            return;
        }

        await this.contact.send({
            name: value.name,
            email: value.email,
            message: value.message,
            captchaToken: token,
        });

        // Un jeton captcha est à usage unique : après tout envoi (réussi ou non),
        // il est consommé → on réinitialise le widget pour un éventuel réessai.
        this.resetCaptcha();
    }

    protected retry(): void {
        this.contact.reset(); // la saisie est conservée : seul le statut repart à idle
    }

    /** Charge le script hCaptcha uniquement quand la section approche du viewport. */
    private loadCaptchaWhenVisible(): void {
        const host = this.captchaHost().nativeElement;
        const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                observer.disconnect();
                this.loadCaptchaScript();
            }
        }, { rootMargin: '200px' });
        observer.observe(host);
    }

    private loadCaptchaScript(): void {
        if (this.document.getElementById('hcaptcha-script')) {
            return;
        }
        (window as Window & { onHcaptchaLoad?: () => void }).onHcaptchaLoad = () =>
            this.renderCaptcha();
        const script = this.document.createElement('script');
        script.id = 'hcaptcha-script';
        script.src = 'https://js.hcaptcha.com/1/api.js?render=explicit&onload=onHcaptchaLoad';
        script.async = true;
        this.document.head.appendChild(script);
    }

    private renderCaptcha(): void {
        if (!window.hcaptcha) {
            return;
        }
        this.captchaWidgetId = window.hcaptcha.render(this.captchaHost().nativeElement, {
            sitekey: environment.contact.hcaptchaSiteKey,
            callback: (token: string) => {
                this.captchaToken.set(token);
                this.captchaMissing.set(false);
            },
            'expired-callback': () => this.captchaToken.set(null),
        });
    }

    private resetCaptcha(): void {
        this.captchaToken.set(null);
        if (window.hcaptcha && this.captchaWidgetId !== null) {
            window.hcaptcha.reset(this.captchaWidgetId);
        }
    }
}
