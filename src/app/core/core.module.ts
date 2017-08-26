import { NgModule } from '@angular/core';

import { ConfigService } from './config/config.service';
import { environment } from '../../environments/environment';
import { DevelopmentConfigService } from './config/dev-config.service';
import { ProductionConfigService } from './config/prod-config.service';

@NgModule({
  imports: [],
  providers: [
    {
      provide: ConfigService,
      useFactory() {
        return !environment.production ?
          new DevelopmentConfigService() : new ProductionConfigService();
      },
    }
  ],
  exports: [],
})
export class CoreModule { }
