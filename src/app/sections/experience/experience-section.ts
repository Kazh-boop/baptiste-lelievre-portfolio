import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';
import { ProfileService } from '../../core/services/profile.service';

@Component({
  selector: 'app-experience-section',
  templateUrl: './experience-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceSection {
  protected readonly i18n = inject(I18nService);
  protected readonly experiences = inject(ProfileService).experiences;
}
