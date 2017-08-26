import { ConfigService } from './config.service';

export class ProductionConfigService extends ConfigService {
  readonly API_URL = 'http://prod-api.scali.io';
}