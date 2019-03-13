import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-mutations',
  templateUrl: './mutations.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MutationsComponent extends BasePageComponent {}
