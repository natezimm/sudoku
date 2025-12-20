import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

type ThemePreference = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storageKey = 'sudokuTheme';
  private readonly darkModeClass = 'dark-mode';

  isDarkMode = false;

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.load();
  }

  toggle(): void {
    this.setDarkMode(!this.isDarkMode);
  }

  setDarkMode(isDarkMode: boolean): void {
    this.isDarkMode = isDarkMode;
    this.apply();
    this.persist();
  }

  private load(): void {
    const saved = localStorage.getItem(this.storageKey);

    if (saved === 'dark' || saved === 'light') {
      this.isDarkMode = saved === 'dark';
      this.apply();
      return;
    }

    this.isDarkMode = false;
    this.apply();
  }

  private apply(): void {
    this.document.documentElement.classList.toggle(this.darkModeClass, this.isDarkMode);
  }

  private persist(): void {
    const preference: ThemePreference = this.isDarkMode ? 'dark' : 'light';
    localStorage.setItem(this.storageKey, preference);
  }
}
