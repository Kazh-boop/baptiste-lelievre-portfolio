import { Injectable, Signal, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';
import { Experience, PersonalProject, Profile, SkillCategory } from '../models/profile.model';
import {
    MOCK_EXPERIENCES,
    MOCK_PERSONAL_PROJECTS,
    MOCK_PROFILE,
    MOCK_SKILL_CATEGORIES,
} from '../data/mock-profile.data';

/**
 * Source de données unique du portfolio.
 *
 * - `environment.isMock = true`  → données mockées locales (v1 actuelle).
 * - `environment.isMock = false` → appels HTTP vers le backend NestJS
 *   (`GET {apiUrl}/profile`, `/experiences`, `/skills`).
 *
 * L'API publique du service (des `Signal` en lecture seule) est identique
 * dans les deux modes : les composants n'ont pas à connaître la source.
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
    private readonly http = inject(HttpClient);

    readonly profile: Signal<Profile>;
    readonly experiences: Signal<readonly Experience[]>;
    readonly skillCategories: Signal<readonly SkillCategory[]>;
    readonly personalProjects: Signal<readonly PersonalProject[]>;

    constructor() {
        if (environment.isMock) {
            this.profile = signal(MOCK_PROFILE).asReadonly();
            this.experiences = signal(MOCK_EXPERIENCES).asReadonly();
            this.skillCategories = signal(MOCK_SKILL_CATEGORIES).asReadonly();
            this.personalProjects = signal(MOCK_PERSONAL_PROJECTS).asReadonly();
        } else {
            // Les données mockées servent de valeur initiale le temps de la réponse
            // réseau : le site ne rend jamais un état vide.
            this.profile = toSignal(this.http.get<Profile>(`${environment.apiUrl}/profile`), {
                initialValue: MOCK_PROFILE,
            });
            this.experiences = toSignal(
                this.http.get<readonly Experience[]>(`${environment.apiUrl}/experiences`),
                { initialValue: MOCK_EXPERIENCES },
            );
            this.skillCategories = toSignal(
                this.http.get<readonly SkillCategory[]>(`${environment.apiUrl}/skills`),
                { initialValue: MOCK_SKILL_CATEGORIES },
            );
            this.personalProjects = toSignal(
                this.http.get<readonly PersonalProject[]>(`${environment.apiUrl}/personalProjects`),
                { initialValue: MOCK_PERSONAL_PROJECTS },
            );
        }
    }
}
