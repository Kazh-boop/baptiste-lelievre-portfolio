import { ChangeDetectionStrategy, Component, inject, Input, signal } from '@angular/core';
import { I18nService } from '../../../core/services/i18n.service';
import { PersonalProject } from '../../../core/models/profile.model';

@Component({
    selector: 'app-project-card',
    templateUrl: './project-card.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    // L'élément hôte <app-project-card> est inline par défaut :
    // on le rend block et pleine largeur pour qu'il remplisse le carousel-item.
    host: { class: 'block w-full' },
})
export class ProjectCard {
    @Input({ required: true }) project!: PersonalProject;
    protected readonly i18n = inject(I18nService);
    protected readonly expanded = signal(false);

    protected toggle(): void {
        this.expanded.update((value) => !value);
    }
}
