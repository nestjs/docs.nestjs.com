import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-pipes',
  templateUrl: './pipes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WsPipesComponent extends BasePageComponent {}
