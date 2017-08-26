import { ConfigService } from './config.service';

export class DevelopmentConfigService extends ConfigService {
  readonly API_URL = 'http://localhost:3001';
}