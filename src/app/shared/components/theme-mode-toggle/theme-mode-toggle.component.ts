import { ChangeDetectorRef, Component, Inject, OnInit, DOCUMENT, ChangeDetectionStrategy } from '@angular/core';
import { StorageService } from '../../services/storage.service';

type Theme = 'light' | 'dark';

@Component({
    selector: 'app-theme-mode-toggle',
    templateUrl: './theme-mode-toggle.component.html',
    styleUrls: ['./theme-mode-toggle.component.scss'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [],
})
export class ThemeModeToggleComponent implements OnInit {
  public theme: Theme;

  // Guards the async cleanup below against rapid toggles.
  private themeChangeCount = 0;

  constructor(
    @Inject(DOCUMENT)
    private readonly document: Document,
    private readonly storageService: StorageService,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  public ngOnInit(): void {
    // Dark is the default theme unless the user explicitly picked light.
    this.setTheme(this.getStoredTheme() ?? 'dark');
  }

  public toggleTheme(skipStorage = false): void {
    const newTheme = this.theme === 'dark' ? 'light' : 'dark';
    // NOTE: We should skip saving theme in storage when toggle is caused by matchMedia change event
    // Otherwise, once saved, it'll no longer correspond to the system preferences,
    // despite the user not touching the toggle button themselves
    if (!skipStorage) this.storageService.set('theme', newTheme);
    this.setTheme(newTheme);
  }

  private getStoredTheme(): Theme | null {
    return this.storageService.get('theme') as Theme | null;
  }

  private setTheme(theme: Theme): void {
    this.theme = theme;

    const root = this.document.documentElement;
    // Freeze transitions while `mode` flips (see the
    // `html[data-suppress-transition]` rule in src/styles.scss). Without this,
    // the body's 200ms background fade blends both palettes — a visible flash.
    const change = ++this.themeChangeCount;
    root.setAttribute('data-suppress-transition', '');
    root.setAttribute('mode', theme);

    // rAF callbacks run before style recalc, so the first frame paints the new
    // theme with transitions still off; re-enable them on the second frame,
    // once the swap is painted and nothing is still changing.
    const cleanup = (): void => {
      // Skip stale cleanup when a newer toggle has re-armed the flag.
      if (this.themeChangeCount === change) {
        root.removeAttribute('data-suppress-transition');
      }
    };

    const view = this.document.defaultView;
    if (view) {
      view.requestAnimationFrame(() => {
        view.requestAnimationFrame(cleanup);
      });
      // Safety net: rAF pauses in background tabs, so guarantee cleanup.
      setTimeout(cleanup, 100);
    } else {
      cleanup();
    }

    this.changeDetector.detectChanges();
  }
}
