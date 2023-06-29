import { Component, Inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MediaMatcher } from '@angular/cdk/layout';

@Component({
  selector: 'app-dark-mode-toggle',
  templateUrl: './dark-mode-toggle.component.html',
  styleUrls: ['./dark-mode-toggle.component.scss'],
})
export class DarkModeToggleComponent implements OnInit {
  isDarkMode: boolean;

  constructor(
    @Inject(DOCUMENT)
    private readonly document: Document,
    private readonly mediaMatcher: MediaMatcher,
  ) {}

  ngOnInit() {
    const userPrefersDark =
      this.mediaMatcher.matchMedia &&
      this.mediaMatcher.matchMedia('(prefers-color-scheme: dark)').matches;
    // In case the user has used the toggle button, we prioritize it over the
    // system settings
    this.setDarkMode(this.getUserSettingsIsDarkMode() || userPrefersDark);
  }

  toggleDarkMode() {
    const isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme-mode', isDarkMode.toString());
    this.setDarkMode(isDarkMode);
  }

  private getUserSettingsIsDarkMode(): boolean {
    return localStorage.getItem('theme-mode') === 'true';
  }

  private setDarkMode(isDarkMode: boolean) {
    this.isDarkMode = isDarkMode;
    this.document.documentElement.setAttribute(
      'mode',
      isDarkMode ? 'dark' : 'light',
    );
  }
}
