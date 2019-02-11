import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-terminus',
  templateUrl: './terminus.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TerminusComponent extends BasePageComponent {
  get dependencies() {
    return `
$ npm install --save @nestjs/terminus @godaddy/terminus`;
  }

  get terminusOptionsService() {
    return `
import {
  TerminusEndpoint,
  TerminusOptionsFactory,
  DNSHealthIndicator,
  TerminusModuleOptions
} from '@nestjs/terminus';

class TerminusOptionsService implements TerminusOptionsFactory {
  constructor(
    @Inject(DNSHealthIndicator) private readonly dns: DNSHealthIndicator,
  ) { }

  createTerminusOptions(): TerminusModuleOptions {
    const healthEndpoint: TerminusEndpoint = {
      url: '/health',
      healthIndicators: [
        async () => this.dns.pingCheck('google', 'https://google.com'),
      ],
    };

    return {
      endpoints: [healthEndpoint],
    };
  }
}`;
  }

  get appModule() {
    return `
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TerminusOptions } from './terminus-options.service';

@Module({
  imports: [
    TerminusModule.forRootAsync({
      useClass: TerminusOptionsService,
    }),
  ],
})
export class ApplicationModule {}`;
  }

  get dogHealthIndicator() {
    return `
import { Injectable } from '@nestjs/common';
import { HealthCheckError } from '@godaddy/terminus';
import { HealthIndicatorResult } from '@brunnerlivio/terminus';

export interface Dog {
  name: string;
  type: string;
}

@Injectable()
export class DogHealthIndicator {
  private readonly dogs: Dog[] = [
    { name: 'Fido', type: 'goodboy' },
    { name: 'Rex', type: 'badboy' },
  ];

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const badboys = this.dogs.filter(dog => dog.type === 'badboy');
    const status = badboys.length > 0 ? 'down' : 'up';

    const result = {
      [key]: { status, badboys: badboys.length },
    };

    if (status === 'down') {
      throw new HealthCheckError('Dogcheck failed', result);
    }
    return result;
  }
}`;
  }
  get terminusOptionsServiceDog() {
    return `
import {
  TerminusEndpoint,
  TerminusOptionsFactory,
  DNSHealthIndicator,
  TerminusModuleOptions
} from '@nestjs/terminus';

class TerminusOptionsService implements TerminusOptionsFactory {
  constructor(
    @Inject(DogHealthIndicator) private readonly dogHealthIndicator: DogHealthIndicator
  ) { }

  createTerminusOptions(): TerminusModuleOptions {
    const healthEndpoint: TerminusEndpoint = {
      url: '/health',
      healthIndicators: [
        async () => this.dogHealthIndicator.isHealthy('dog'),
      ],
    };

    return {
      endpoints: [healthEndpoint],
    };
  }
}`;
  }

  get appModuleDog() {
    return `
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TerminusOptions } from './terminus-options.service';
import { DogHealthIndicator } from './dog.health.ts';

@Module({
  providers: [DogHealthIndicator],
  exports: [DogHealthIndicator]
  imports: [
    TerminusModule.forRootAsync({
      imports: [ApplicationModule],
      useClass: TerminusOptionsService,
    }),
  ],
})
export class ApplicationModule {}`;
  }

  get dogOutput() {
    return `
{
  "status": "error",
  "error": {
    "dog": {
      "status": "down",
      "badboys": 1
    }
  }
}`;
  }
}
