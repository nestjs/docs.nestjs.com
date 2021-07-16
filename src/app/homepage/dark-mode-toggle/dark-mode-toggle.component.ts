import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';

@Component({
  selector: 'app-dark-mode-toggle',
  templateUrl: './dark-mode-toggle.component.html',
  styleUrls: ['./dark-mode-toggle.component.scss'],
})
export class DarkModeToggleComponent implements OnInit {
  isDarkMode: boolean;

  private getUserSettingsIsDarkMode(): boolean {
    return localStorage.getItem('DARK_MODE') === 'true';
  }

  private setDarkMode(isDarkMode: boolean) {
    this.isDarkMode = isDarkMode;
    this.document.documentElement.setAttribute(
      'mode',
      isDarkMode ? 'dark' : 'light',
    );
  }

  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

  ngOnInit() {
    const userPrefersDark =
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    // In case the user has used the toggle button, we prioritize it over the
    // system settings
    this.setDarkMode(this.getUserSettingsIsDarkMode() || userPrefersDark);
  }

  toggleDarkMode() {
    const isDarkMode = !this.isDarkMode;
    localStorage.setItem('DARK_MODE', isDarkMode.toString());
    this.setDarkMode(isDarkMode);
  }
}
