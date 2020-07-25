import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-directives',
  templateUrl: './directives.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DirectivesComponent extends BasePageComponent {}
