import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-complexity',
  templateUrl: './complexity.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComplexityComponent extends BasePageComponent {}
