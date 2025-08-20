import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-apitally',
  templateUrl: './apitally.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApitallyComponent extends BasePageComponent {}
