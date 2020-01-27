import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-module-ref',
  templateUrl: './module-reference.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModuleRefComponent extends BasePageComponent {}
