import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';
import { ProfileService } from '../../core/services/profile.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  protected readonly i18n = inject(I18nService);
  protected readonly profile = inject(ProfileService).profile;
  protected readonly year = new Date().getFullYear();
}
