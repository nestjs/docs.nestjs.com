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
const connectionProvider = { provide: 'ConnectionToken', useValue: null };

@Module({
  components: [connectionProvider],
})`;
  }

  get useFactory() {
    return `
const connectionFactory = {
  provide: 'ConnectionToken',
  useFactory: (optionsProvider: OptionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  components: [connectionFactory],
})`;
  }

  get useFactoryJs() {
    return `
const connectionFactory = {
  provide: 'ConnectionToken',
  useFactory: (optionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  components: [connectionFactory],
})`;
  }

  get useClass() {
    return `
const configServiceProvider = {
  provide: ConfigService,
  useClass: DevelopmentConfigService,
};

@Module({
  components: [configServiceProvider],
})
`;
  }

  get inject() {
    return `
@Component()
class CatsRepository {
  constructor(@Inject('ConnectionToken') connection: Connection) {}
}`;
  }

  get injectJs() {
    return `
@Component()
@Dependencies('ConnectionToken')
class CatsRepository {
  constructor(connection) {}
}`;
  }
}