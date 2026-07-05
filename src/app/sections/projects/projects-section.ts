import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';
import { ProfileService } from '../../core/services/profile.service';
import { ProjectsCard } from "./projects-card/projects-card";

@Component({
  selector: 'app-projects-section',
  templateUrl: './projects-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProjectsCard],
})
export class ProjectsSection {
  protected readonly i18n = inject(I18nService);
  protected readonly projects = inject(ProfileService).personalProjects;
}
