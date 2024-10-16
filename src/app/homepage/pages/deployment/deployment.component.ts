import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../page/page.component';

@Component({
  selector: 'app-deployment',
  templateUrl: './deployment.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeploymentComponent extends BasePageComponent {}
