import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-mvc',
  templateUrl: './mvc.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MvcComponent extends BasePageComponent {}
