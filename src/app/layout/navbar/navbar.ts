import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';
import { ThemeService } from '../../core/services/theme.service';
import { NAV_LINKS } from '../../core/data/nav-links';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'sticky top-0 z-40 block' },
})
export class Navbar {
    protected readonly i18n = inject(I18nService);
    protected readonly theme = inject(ThemeService);
    protected readonly links = NAV_LINKS;
}
