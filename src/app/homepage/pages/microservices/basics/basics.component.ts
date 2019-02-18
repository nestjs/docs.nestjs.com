import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-basics',
  templateUrl: './basics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicsComponent extends BasePageComponent {}
