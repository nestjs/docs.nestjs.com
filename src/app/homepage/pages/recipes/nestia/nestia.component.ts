
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-nestia',
  templateUrl: './nestia.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NestiaComponent extends BasePageComponent {}
