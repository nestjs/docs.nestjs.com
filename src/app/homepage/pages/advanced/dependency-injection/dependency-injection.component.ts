import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-dependency-injection',
  templateUrl: './dependency-injection.component.html',
  styleUrls: ['./dependency-injection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DependencyInjectionComponent extends BasePageComponent {
  get useValue() {
    return `
@Module({
  components: [
      {
          provide: 'ConnectionToken',
          useValue: null,
      },
  ],
})`;
  }

  get useFactory() {
    return `
@Module({
  components: [
    {
      provide: 'ConnectionToken',
      useFactory: (optionsProvider: OptionsProvider) => {
        const options = optionsProvider.get();
        return new DatabaseConnection(options);
      },
      inject: [OptionsProvider],
    },
  ],
})`;
  }

  get useClass() {
    return `
@Module({
  components: [
    {
      provide: ConfigService,
      useClass: DevelopmentConfigService,
    },
  ],
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
}