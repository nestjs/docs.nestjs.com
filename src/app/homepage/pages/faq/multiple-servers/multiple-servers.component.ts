import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-multiple-servers',
  templateUrl: './multiple-servers.component.html',
  styleUrls: ['./multiple-servers.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MultipleServersComponent extends BasePageComponent {}