import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-necord',
  templateUrl: './necord.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NecordComponent extends BasePageComponent {}
