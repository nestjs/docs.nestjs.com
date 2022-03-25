import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export default class Versions {
  version: String;
}

@Injectable({ providedIn: 'root' })
export class VersionsService {
  constructor(private readonly httpClient: HttpClient) {}

  addToVersionLatest(): Observable<Versions[]> {
    const urlVersionsLatest = 'https://registry.npmjs.org/@nestjs/core/latest';
    return this.httpClient.get<Versions[]>(urlVersionsLatest);
  }
}
