import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-hybrid-application',
  templateUrl: './hybrid-application.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HybridApplicationComponent extends BasePageComponent {}
