import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-lazy-loading',
  templateUrl: './lazy-loading-modules.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LazyLoadingModulesComponent extends BasePageComponent {}
