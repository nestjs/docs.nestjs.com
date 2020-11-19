import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-csrf',
  templateUrl: './csrf.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CsrfComponent extends BasePageComponent {}
