import { Injectable } from '@angular/core';

@Injectable()
export abstract class ConfigService {
  abstract readonly API_URL: string;
}