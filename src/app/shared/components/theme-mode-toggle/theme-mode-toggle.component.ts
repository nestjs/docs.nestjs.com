import { Component, Inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MediaMatcher } from '@angular/cdk/layout';
import { StorageService } from '../../services/storage.service';

type Theme = 'light' | 'dark';

@Component({
  selector: 'app-theme-mode-toggle',
  templateUrl: './theme-mode-toggle.component.html',
  styleUrls: ['./theme-mode-toggle.component.scss'],
})
export class ThemeModeToggleComponent implements OnInit {
  theme: Theme;

  constructor(
    @Inject(DOCUMENT)
    private readonly document: Document,
    private readonly mediaMatcher: MediaMatcher,
    private readonly storageService: StorageService,
  ) {}

  ngOnInit() {
    const darkSchemeMatcher = this.mediaMatcher.matchMedia(
      '(prefers-color-scheme: dark)',
    );

    darkSchemeMatcher.onchange = ({ matches }) => {
      if (!this.getStoredTheme()) this.setTheme(matches ? 'dark' : 'light');
    };

    const preferredScheme = darkSchemeMatcher.matches ? 'dark' : 'light';
    const storedTheme = this.getStoredTheme();

    this.theme = storedTheme ?? preferredScheme;
    this.setTheme(this.theme);
  }

  toggleTheme(skipStorage = false) {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    // NOTE: We should skip saving theme in storage when toggle is caused by matchMedia change event
    // Otherwise, once saved, it'll no longer correspond to the system preferences,
    // despite the user not touching the toggle button themselves
    if (!skipStorage) this.storageService.set('theme', this.theme);
    this.setTheme(this.theme);
  }

  private getStoredTheme() {
    return this.storageService.get('theme') as Theme | null;
  }

  private setTheme(theme: Theme) {
    this.document.documentElement.setAttribute('mode', theme);
  }
}
