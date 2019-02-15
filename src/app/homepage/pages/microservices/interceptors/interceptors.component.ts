import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-interceptors',
  templateUrl: './interceptors.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MicroservicesInterceptorsComponent extends BasePageComponent {}
