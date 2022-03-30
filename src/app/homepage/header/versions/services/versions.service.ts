import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export default class Versions {
  version: String;
}

@Injectable({ providedIn: 'root' })
export class VersionsService {
  constructor(private readonly httpClient: HttpClient) {}

  addToVersionLatest(): Observable<any> {
    const urlVersionsLatest = 'https://registry.npmjs.org/@nestjs/core/latest';
    return this.httpClient.get<Versions>(urlVersionsLatest).pipe(
      catchError((err) => {
        return throwError(err);
      }),
    );
  }
}
