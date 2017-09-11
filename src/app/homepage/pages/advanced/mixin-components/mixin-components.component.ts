import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-mixin-components',
  templateUrl: './mixin-components.component.html',
  styleUrls: ['./mixin-components.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MixinComponentsComponent extends BasePageComponent {
  get cacheInterceptor() {
    return `
import { Interceptor, NestInterceptor, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

@Interceptor()
export abstract class CacheInterceptor implements NestInterceptor {
  protected abstract readonly isCached: () => boolean;

  intercept(dataOrRequest, context: ExecutionContext, stream$: Observable<any>): Observable<any> {
    if (this.isCached()) {
      return Observable.of([]);
    }
    return stream$;
  }
}`;
  }
}
