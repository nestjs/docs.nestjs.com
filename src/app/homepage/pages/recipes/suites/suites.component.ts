import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-suites',
  templateUrl: './suites.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuitesComponent extends BasePageComponent {}
