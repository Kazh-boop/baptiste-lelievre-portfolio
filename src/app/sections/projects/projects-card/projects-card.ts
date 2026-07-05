import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { I18nService } from '../../../core/services/i18n.service';
import { ProfileService } from '../../../core/services/profile.service';
import { PersonalProject } from '../../../core/models/profile.model';

@Component({
  selector: 'app-projects-card',
  templateUrl: './projects-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsCard {
    @Input({ required: true }) project!: PersonalProject;
    protected readonly i18n = inject(I18nService);
    protected readonly categories = inject(ProfileService).skillCategories;
}
