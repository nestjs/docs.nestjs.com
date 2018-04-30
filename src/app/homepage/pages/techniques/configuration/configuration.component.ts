import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigurationComponent extends BasePageComponent {
  get packages() {
    return `
$ npm i --save dotenv`;
  }
  get configService() {
    return `
import * as dotenv from 'dotenv';
import * as fs from 'fs';

export class ConfigService {
  private readonly envConfig: { [prop: string]: string };

  constructor(filePath: string) {
    this.envConfig = dotenv.parse(fs.readFileSync(filePath))
  }

  get(key: string): string {
    return this.envConfig[key];
  }
}`;
  }

  get configServiceJs() {
    return `
import * as dotenv from 'dotenv';
import * as fs from 'fs';

export class ConfigService {
  constructor(filePath) {
    this.envConfig = dotenv.parse(fs.readFileSync(filePath))
  }

  get(key) {
    return this.envConfig[key];
  }
}`;
  }

  get configModule() {
    return `
import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';

@Module({
  providers: [
    {
      provide: ConfigService,
      useValue: new ConfigService(\`\${process.env.NODE_ENV}.env\`),
    },
  ],
  exports: [ConfigService],
})
export class ConfigModule {}`;
  }

  get sampleEnv() {
    return `
DATABASE_USER=test
DATABASE_PASSWORD=test`;
  }

  get configModuleImport() {
    return `
@Module({
  imports: [ConfigModule],
  ...
})`;
  }

  get configServiceInjection() {
    return `
@Injectable()
export class AppService {
  private isAuthEnabled: boolean;
  constructor(config: ConfigService) {
    // Please take note that this check is case sensitive!
    this.isAuthEnabled = config.get('IS_AUTH_ENABLED') === 'true' ? true : false;
  }
}
    `;
  }

  get configServiceValidation() {
    return `
import * as Joi from 'joi';
import * as fs from 'fs';

export interface EnvConfig {
  [prop: string]: string;
}

export class ConfigService {
  private readonly envConfig: EnvConfig;

  constructor(filePath: string) {
    const config = dotenv.parse(fs.readFileSync(filePath));
    this.envConfig = this.validateInput(config);
  }

  /**
   * Ensures all needed variables are set, and returns the validated JavaScript object 
   * including the applied default values.
   */
  private validateInput(envConfig: EnvConfig): EnvConfig {
    const envVarsSchema: Joi.ObjectSchema = Joi.object({
      NODE_ENV: Joi.string()
        .valid(['development', 'production', 'test', 'provision'])
        .default('development'),
      PORT: Joi.number().default(3000),
      API_AUTH_ENABLED: Joi.boolean().required(),
    });

    const { error, value: validatedEnvConfig } = Joi.validate(
      envConfig,
      envVarsSchema,
    );
    if (error) {
      throw new Error(\`Config validation error: \${error.message}\`);
    }
    return validatedEnvConfig;
  }
}`;
  }

  get configServiceProperties() {
    return `
get isApiAuthEnabled(): boolean {
  return Boolean(this.envConfig.API_AUTH_ENABLED);
}`;
  }

  get advancedConfigServiceSample() {
    return `
@Injectable()
export class AppService {
  constructor(config: ConfigService) {
    if (config.isApiAuthEnabled) {
      // Authorization is enabled
    }
  }
}
    `;
  }
}
