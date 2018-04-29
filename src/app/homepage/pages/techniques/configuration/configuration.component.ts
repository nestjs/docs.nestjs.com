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
  const isAuthEnabled: boolean;
  constructor(@Inject('ConfigService') config: ConfigService) {
    // Please take note that this check is case sensitive!
    this.isAuthEnabled = config.get('IS_AUTH_ENABLED') === 'true' ? true : false;
  }
}
    `;
  }

  get configServiceValidation() {
    return `
import * as Joi from 'joi';
import { IEnvConfig } from './interfaces/env-config.interface';
import * as fs from 'fs';

constructor(filePath: string) {
  const envConfig: IEnvConfig = dotenv.parse(fs.readFileSync(filePath));
  const validatedEnvConfig: IEnvConfig = this.validateInput(envConfig);
}

/**
 * Ensures all needed variables are set and returns the validated JavaScript object including the
 * applied defaults.
 */
private validateInput(envConfig: IEnvConfig): IEnvConfig {
  const envVarsSchema: Joi.ObjectSchema = Joi.object({
    // General
    NODE_ENV: Joi.string()
      .valid(['development', 'production', 'test', 'provision'])
      .default('development'),
    PORT: Joi.number().default(3000),

    // API Settings
    API_AUTH_ENABLED: Joi.boolean().required()
  });

  const { error, value: validatedEnvConfig } = Joi.validate(envConfig, envVarsSchema);
  if (error) {
    throw new Error(\`Config validation error: \${error.message}\`);
  }

  return validatedEnvConfig;
}
    `;
  }

  get envConfigInterface() {
    return `
export interface IEnvConfig {
  [prop: string]: string;
}
    `;
  }

  get configServiceProperties() {
    return `
export class ConfigService {
  public env: NodeEnvs;
  public port: number;
  public isApiAuthEnabled: boolean;

  constructor(filePath: string) {
    const envConfig: IEnvConfig = dotenv.parse(fs.readFileSync(filePath));
    const validatedEnvConfig: IEnvConfig = this.validateInput(envConfig);
    this.initializeProperties(validatedEnvConfig);
  }

  /**
   * Initializes the class properties with the passed values
   * @param processEnv The validated process environment variables
   */
  private initializeProperties(processEnv: IEnvConfig): void {
    this.env = processEnv.NODE_ENV;
    // Actually the types are already correct, but the IEnvConfig interface says it's still a string
    this.port = Number(processEnv.PORT);
    this.isApiAuthEnabled = Boolean(processEnv.API_AUTH_ENABLED);
}

enum NodeEnvs {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Provision = 'provision'
}
    `;
  }

  get advancedConfigServiceSample() {
    return `
@Injectable()
export class AppService {
  constructor(@Inject('ConfigService') private config: ConfigService) {
    if (config.isApiAuthEnabled) {
      // Auth is enabled
    }
  }
}
    `;
  }
}
