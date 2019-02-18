import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-adapter',
  templateUrl: './adapter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdapterComponent extends BasePageComponent {}
