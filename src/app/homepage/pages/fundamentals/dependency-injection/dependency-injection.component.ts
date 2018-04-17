import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-dependency-injection',
  templateUrl: './dependency-injection.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DependencyInjectionComponent extends BasePageComponent {
  get useValue() {
    return `
import { connection } from './connection';

const connectionProvider = {
  provide: 'Connection',
  useValue: connection,
};

@Module({
  providers: [connectionProvider],
})
export class ApplicationModule {}`;
  }

  get override() {
    return `
import { CatsService } from './cats.service';

const mockCatsService = {};
const catsServiceProvider = {
  provide: CatsService,
  useValue: mockCatsService,
};

@Module({
  imports: [CatsModule],
  providers: [catsServiceProvider],
})
export class ApplicationModule {}`;
  }

  get useFactory() {
    return `
const connectionFactory = {
  provide: 'Connection',
  useFactory: (optionsProvider: OptionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  providers: [connectionFactory],
})
export class ApplicationModule {}`;
  }

  get useFactoryJs() {
    return `
const connectionFactory = {
  provide: 'Connection',
  useFactory: (optionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  providers: [connectionFactory],
})
export class ApplicationModule {}`;
  }

  get useClass() {
    return `
const configServiceProvider = {
  provide: ConfigService,
  useClass: process.env.NODE_ENV === 'development'
    ? DevelopmentConfigService
    : ProductionConfigService,
};

@Module({
  providers: [configServiceProvider],
})
export class ApplicationModule {}
`;
  }

  get inject() {
    return `
@Injectable()
class CatsRepository {
  constructor(@Inject('Connection') connection: Connection) {}
}`;
  }

  get injectJs() {
    return `
@Injectable()
@Dependencies('Connection')
class CatsRepository {
  constructor(connection) {}
}`;
  }

  get useFactoryExports() {
    return `
const connectionFactory = {
  provide: 'Connection',
  useFactory: (optionsProvider: OptionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  providers: [connectionFactory],
  exports: ['Connection'],
})
export class ApplicationModule {}`;
  }

  get useFactoryExportsJs() {
    return `
const connectionFactory = {
  provide: 'Connection',
  useFactory: (optionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  providers: [connectionFactory],
  exports: ['Connection'],
})
export class ApplicationModule {}`;
  }

  get useFactoryExportsObject() {
    return `
const connectionFactory = {
  provide: 'Connection',
  useFactory: (optionsProvider: OptionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  providers: [connectionFactory],
  exports: [connectionFactory],
})
export class ApplicationModule {}`;
  }

  get useFactoryExportsObjectJs() {
    return `
const connectionFactory = {
  provide: 'Connection',
  useFactory: (optionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  providers: [connectionFactory],
  exports: [connectionFactory],
})
export class ApplicationModule {}`;
  }
}