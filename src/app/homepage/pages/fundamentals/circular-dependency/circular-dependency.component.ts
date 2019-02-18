import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-circular-dependency',
  templateUrl: './circular-dependency.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CircularDependencyComponent extends BasePageComponent {}
