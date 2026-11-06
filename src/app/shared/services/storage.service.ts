import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  // Prerendering runs without localStorage: nothing is stored, nothing is read.
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  public set(key, val: unknown): void {
    if (!this.isBrowser) {
      return;
    }
    localStorage.setItem(key, JSON.stringify(val));
  }

  /**
   * Returns the localStorage item for the given key, if any.
   * Returns null elsewhere
   */
  public get(key: string): unknown | null {
    if (!this.isBrowser) {
      return null;
    }
    const result = localStorage.getItem(key);

    return result ? JSON.parse(result) : null;
  }

  public remove(key: string): void {
    const hasStorageKey = this.get(key);

    if (hasStorageKey) {
      localStorage.removeItem(key);
    }
  }
}
