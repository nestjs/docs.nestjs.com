import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-quick-start',
  templateUrl: './quick-start.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickStartComponent extends BasePageComponent {
  get middleware() {
    return `
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

@Module({
  imports: [
    GraphQLModule.forRoot({
      typePaths: ['./**/*.graphql'],
    }),
  ],
})
export class ApplicationModule {}`;
  }

  get moreOptions() {
    return `
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

@Module({
  imports: [
    GraphQLModule.forRoot({
      typePaths: ['./**/*.graphql'],
      debug: false,
      playground: false,
    }),
  ],
})
export class ApplicationModule {}`;
  }

  get asyncConfiguration() {
    return `
GraphQLModule.forRootAsync({
  useFactory: () => ({
    typePaths: ['./**/*.graphql'],
  }),
})`;
  }

  get asyncConfigurationFactoryAsync() {
    return `
GraphQLModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    typePaths: configService.getString('GRAPHQL_TYPE_PATHS'),
  }),
  inject: [ConfigService],
})`;
  }

  get asyncConfigurationClass() {
    return `
GraphQLModule.forRootAsync({
  useClass: GqlConfigService,
})`;
  }

  get asyncConfigurationClassBody() {
    return `
@Injectable()
class GqlConfigService implements GqlOptionsFactory {
  createGqlOptions(): GqlModuleOptions {
    return {
      typePaths: ['./**/*.graphql'],
    };
  }
}`;
  }

  get asyncConfigurationExisting() {
    return `
GraphQLModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
})`;
  }

  get includeSubset() {
    return `
GraphQLModule.forRoot({
  include: [CatsModule],
})`;
  }
}
