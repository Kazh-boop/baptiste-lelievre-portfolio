import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ContactMessage, ContactStatus } from '../models/contact.model';

/**
 * Transport des messages de contact.
 * Aujourd'hui : relais Web3Forms → boîte mail.
 * Demain : POST {apiUrl}/contact (NestJS) — seul ce fichier changera.
 */
@Injectable({ providedIn: 'root' })
export class ContactService {
    private readonly http = inject(HttpClient);

    private readonly _status = signal<ContactStatus>('idle');
    readonly status = this._status.asReadonly();

    async send(message: ContactMessage): Promise<void> {
        this._status.set('sending');
        if (environment.contact.isMock) {
            await new Promise((resolve) => setTimeout(resolve, 800));
            this._status.set('sent');
            return;
        }
        try {
            const response = await firstValueFrom(
                this.http.post<{ success: boolean }>(environment.contact.endpoint, {
                    access_key: environment.contact.accessKey,
                    name: message.name,
                    email: message.email,
                    message: message.message,
                    'h-captcha-response': message.captchaToken,
                    subject: `Portfolio — message de ${message.name}`,
                }),
            );
            this._status.set(response.success ? 'sent' : 'error');
        } catch {
            this._status.set('error');
        }
    }

    /**
     * Succès simulé pour les soumissions détectées comme bots (honeypot, délai).
     * On ne renvoie JAMAIS d'erreur à un bot : il apprendrait à contourner.
     */
    async simulateSuccess(): Promise<void> {
        this._status.set('sending');
        await new Promise((resolve) => setTimeout(resolve, 600));
        this._status.set('sent');
    }

    reset(): void {
        this._status.set('idle');
    }
}
