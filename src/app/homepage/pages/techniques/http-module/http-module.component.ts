import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-http-module',
  templateUrl: './http-module.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HttpModuleComponent extends BasePageComponent {}
