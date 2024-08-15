import { Component, Inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MediaMatcher } from '@angular/cdk/layout';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-theme-mode-toggle',
  templateUrl: './theme-mode-toggle.component.html',
  styleUrls: ['./theme-mode-toggle.component.scss'],
})
export class ThemeModeToggleComponent implements OnInit {
  isDarkMode: boolean;

  constructor(
    @Inject(DOCUMENT)
    private readonly document: Document,
    private readonly mediaMatcher: MediaMatcher,
    private readonly storageService: StorageService,
  ) {}

  ngOnInit() {
    // This is commented out because by default the theme mode is set to light (at least for now)
    // const userPrefersTheme =
    //   this.mediaMatcher.matchMedia &&
    //   this.mediaMatcher.matchMedia('(prefers-color-scheme: light)').matches;
    // this.setThemeMode(this.getUserSettingsIsDarkMode() || userPrefersTheme);

    const isDarkMode = this.getUserSettingsIsDarkMode();
    this.setThemeMode(isDarkMode);
  }

  toggleThemeMode() {
    const isDarkMode = !this.isDarkMode;
    this.storageService.set('theme-mode', isDarkMode.toString());
    this.setThemeMode(isDarkMode);
  }

  private getUserSettingsIsDarkMode(): boolean {
    return this.storageService.get('theme-mode') === 'true';
  }

  private setThemeMode(isDarkMode: boolean) {
    this.isDarkMode = isDarkMode;
    this.document.documentElement.setAttribute(
      'mode',
      isDarkMode ? 'dark' : 'light',
    );
  }
}
