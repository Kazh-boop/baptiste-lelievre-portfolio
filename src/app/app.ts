import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Navbar } from './layout/navbar/navbar';
import { Footer } from './layout/footer/footer';
import { Hero } from './sections/hero/hero';
import { ExperienceSection } from './sections/experience/experience-section';
import { SkillsSection } from './sections/skills/skills-section';
import { I18nService } from './core/services/i18n.service';
import { NAV_LINKS } from './core/data/nav-links';
import { ProjectsSection } from "./sections/projects/projects-section";

@Component({
  selector: 'app-root',
  imports: [Navbar, Footer, Hero, ExperienceSection, ProjectsSection, SkillsSection ],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly i18n = inject(I18nService);
  protected readonly links = NAV_LINKS;
}
