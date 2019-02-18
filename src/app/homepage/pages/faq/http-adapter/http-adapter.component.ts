import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-http-adapter',
  templateUrl: './http-adapter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HttpAdapterComponent extends BasePageComponent {}
