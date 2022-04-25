import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-authorization',
  templateUrl: './authorization.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorizationComponent extends BasePageComponent {}
