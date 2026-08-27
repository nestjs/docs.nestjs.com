import { ChangeDetectorRef, Component, Inject, OnInit, DOCUMENT } from '@angular/core';
import { StorageService } from '../../services/storage.service';

type Theme = 'light' | 'dark';

@Component({
    selector: 'app-theme-mode-toggle',
    templateUrl: './theme-mode-toggle.component.html',
    styleUrls: ['./theme-mode-toggle.component.scss'],
    standalone: true,
    imports: [],
})
export class ThemeModeToggleComponent implements OnInit {
  public theme: Theme;

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
    this.document.documentElement.setAttribute('mode', theme);
    this.changeDetector.detectChanges();
  }
}
