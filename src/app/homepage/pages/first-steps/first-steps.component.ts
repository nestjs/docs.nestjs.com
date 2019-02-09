import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../page/page.component';

@Component({
  selector: 'app-first-steps',
  templateUrl: './first-steps.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FirstStepsComponent extends BasePageComponent {}
