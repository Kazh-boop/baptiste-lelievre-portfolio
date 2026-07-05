import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';
import { ProfileService } from '../../core/services/profile.service';

@Component({
  selector: 'app-skills-section',
  templateUrl: './skills-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillsSection {
  protected readonly i18n = inject(I18nService);
  protected readonly categories = inject(ProfileService).skillCategories;
}
