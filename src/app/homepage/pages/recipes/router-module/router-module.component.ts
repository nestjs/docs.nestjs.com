import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-router-module',
  templateUrl: './router-module.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RouterModuleComponent extends BasePageComponent {}
