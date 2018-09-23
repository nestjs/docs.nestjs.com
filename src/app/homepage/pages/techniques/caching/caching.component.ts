import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-caching',
  templateUrl: './caching.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CachingComponent extends BasePageComponent {
  get inMemoryCache() {
    return `
import { CacheModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';

@Module({
  imports: [CacheModule.register()],
  controllers: [AppController],
})
export class ApplicationModule {}`;
  }

  get appController() {
    return `
@Controller()
@UseInterceptors(CacheInterceptor)
export class AppController {
  @Get()
  findAll(): string[] {
    return [];
  }
}`;
  }

  get globalCache() {
    return `
import { CacheModule, Module, CacheInterceptor } from '@nestjs/common';
import { AppController } from './app.controller';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [CacheModule.register()],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class ApplicationModule {}`;
  }

  get websockets() {
    return `
@CacheKey('events')
@UseInterceptors(CacheInterceptor)
@SubscribeMessage('events')
onEvent(client, data): Observable<string[]> {
  return [];
}`;
  }

  get customizeCache() {
    return `
CacheModule.register({
  ttl: 5, // seconds
  max: 10, // maximum number of items in cache
})`;
  }

  get redisStore() {
    return `
import * as redisStore from 'cache-manager-redis-store';
import { CacheModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';

@Module({
  imports: [CacheModule.register({
    store: redisStore,
    host: 'localhost',
    port: 6379,
  })],
  controllers: [AppController],
})
export class ApplicationModule {}`;
  }

  get trackBy() {
    return `
@Injectable()
class HttpCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    return 'key';
  }
}`;
  }

  get asyncConfiguration() {
    return `
CacheModule.forRootAsync({
  useFactory: () => ({
    ttl: 5,
  }),
})`;
  }

  get asyncConfigurationFactoryAsync() {
    return `
CacheModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    ttl: configService.getString('CACHE_TTL'),
  }),
  inject: [ConfigService],
})`;
  }

  get asyncConfigurationClass() {
    return `
CacheModule.forRootAsync({
  useClass: CacheConfigService,
})`;
  }

  get asyncConfigurationClassBody() {
    return `
@Injectable()
class CacheConfigService implements CacheOptionsFactory {
  createCacheOptions(): CacheModuleOptions {
    return {
      ttl: 5,
    };
  }
}`;
  }

  get asyncConfigurationExisting() {
    return `
CacheModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
})`;
  }
}