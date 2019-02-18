import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-dependency-injection',
  templateUrl: './dependency-injection.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DependencyInjectionComponent extends BasePageComponent {}
