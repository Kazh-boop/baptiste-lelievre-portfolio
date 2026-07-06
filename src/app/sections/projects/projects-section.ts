import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';
import { ProfileService } from '../../core/services/profile.service';
import { ProjectCard } from "./project-card/project-card";

@Component({
  selector: 'app-projects-section',
  templateUrl: './projects-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProjectCard],
})
export class ProjectsSection {
    protected readonly i18n = inject(I18nService);
    protected readonly projects = inject(ProfileService).personalProjects;

    private readonly carousel = viewChild.required<ElementRef<HTMLDivElement>>('carousel');

    /** Index du projet affiché. */
    protected readonly current = signal(0);
    protected readonly isFirst = computed(() => this.current() === 0);
    protected readonly isLast = computed(
        () => this.current() >= this.projects().length - 1,
    );

    protected goTo(index: number): void {
        const max = this.projects().length - 1;
        const clamped = Math.max(0, Math.min(index, max));
        const el = this.carousel().nativeElement;
        el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' });
        this.current.set(clamped);
    }

    /** Garde l'index synchronisé quand l'utilisateur swipe au doigt. */
    protected onScroll(): void {
        const el = this.carousel().nativeElement;
        this.current.set(Math.round(el.scrollLeft / el.clientWidth));
    }
}
