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
}
