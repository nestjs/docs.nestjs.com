import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-multiple-servers',
  templateUrl: './multiple-servers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultipleServersComponent extends BasePageComponent {}
