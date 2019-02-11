import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../page/page.component';

@Component({
  selector: 'app-modules',
  templateUrl: './modules.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModulesComponent extends BasePageComponent {}
