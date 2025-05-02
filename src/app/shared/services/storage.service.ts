import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  public set(key, val: unknown): void {
    localStorage.setItem(key, JSON.stringify(val));
  }

  /**
   * Returns the localStorage item for the given key, if any.
   * Returns null elsewhere
   */
  public get(key: string): unknown | null {
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
