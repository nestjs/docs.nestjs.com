import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-openapi-operations',
  templateUrl: './operations.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationsComponent extends BasePageComponent {}
