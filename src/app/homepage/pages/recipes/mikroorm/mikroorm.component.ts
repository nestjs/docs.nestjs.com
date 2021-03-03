import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-mikroorm',
  templateUrl: './mikroorm.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MikroOrmComponent extends BasePageComponent {}
