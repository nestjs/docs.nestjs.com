import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-enums',
  templateUrl: './enums.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnumsComponent extends BasePageComponent {}
