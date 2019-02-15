import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-guards-interceptors',
  templateUrl: './guards-interceptors.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuardsInterceptorsComponent extends BasePageComponent {}
