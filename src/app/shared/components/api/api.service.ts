import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';

/** Where `npm run api` writes the API reference (see tools/api/compiler). */
const GENERATED_URL = '/generated';

export interface ApiItem {
  name: string;
  title: string;
  path: string;
  docType: string;
  stability: string;
}

export interface ApiSection {
  name: string;
  title: string;
  path: string;
  group?: string;
  deprecated?: boolean;
  items: ApiItem[] | null;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly documents = new Map<string, Observable<string>>();
  private apiList$?: Observable<ApiSection[]>;

  /** Every package and its exports, in overview order. */
  getApiList(): Observable<ApiSection[]> {
    this.apiList$ ??= this.http
      .get<ApiSection[]>(`${GENERATED_URL}/api/api-list.json`)
      .pipe(shareReplay(1));
    return this.apiList$;
  }

  /** The rendered page for an API path such as `/api/common/Injectable`. */
  getDocument(path: string): Observable<string> {
    let doc$ = this.documents.get(path);
    if (!doc$) {
      doc$ = this.http
        .get(`${GENERATED_URL}${path}.html`, { responseType: 'text' })
        .pipe(
          map((html) => {
            // A missing page is answered with the app's index.html (the SPA
            // fallback in src/_redirects), not a 404. Generated pages are
            // fragments, never whole documents.
            if (/<html[\s>]/i.test(html)) {
              throw new Error(`No API reference page for ${path}`);
            }
            return html;
          }),
          shareReplay(1),
        );
      this.documents.set(path, doc$);
    }
    return doc$;
  }

  prefetchDocument(path: string): void {
    this.getDocument(path).subscribe({
      error: () => this.documents.delete(path),
    });
  }
}
