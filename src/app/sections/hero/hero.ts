import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';
import { ProfileService } from '../../core/services/profile.service';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero {
  protected readonly i18n = inject(I18nService);
  private readonly profileService = inject(ProfileService);

  protected readonly profile = this.profileService.profile;

  protected readonly githubUrl = computed(
    () => this.profile().links.find((link) => link.id === 'github')?.url ?? null,
  );

  protected readonly linkedinUrl = computed(
    () => this.profile().links.find((link) => link.id === 'linkedin')?.url ?? null
  )

  protected readonly cvUrl = computed(
    () => this.profile().links.find((link) => link.id === 'cv')?.url ?? null
  )

  /** Initiales affichées dans l'avatar tant qu'aucune photo n'est fournie. */
  protected readonly initials = computed(() =>
    this.profile()
      .name.split(/\s+/)
      .map((part) => part.charAt(0))
      .join(''),
  );
}
