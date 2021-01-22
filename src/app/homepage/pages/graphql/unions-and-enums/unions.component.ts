import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-unions-enums',
  templateUrl: './unions-and-enums.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnionsAndEnumsComponent extends BasePageComponent {}
