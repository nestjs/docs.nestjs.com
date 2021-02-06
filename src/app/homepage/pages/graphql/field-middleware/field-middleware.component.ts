import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-field-middleware',
  templateUrl: './field-middleware.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldMiddlewareComponent extends BasePageComponent {}
