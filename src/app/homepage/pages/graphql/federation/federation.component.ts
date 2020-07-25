import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-federation',
  templateUrl: './federation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FederationComponent extends BasePageComponent {}
