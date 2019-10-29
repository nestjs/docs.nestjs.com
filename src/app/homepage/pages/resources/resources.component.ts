import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../page/page.component';

@Component({
  selector: 'app-resources',
  templateUrl: './resources.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourcesComponent extends BasePageComponent {}
