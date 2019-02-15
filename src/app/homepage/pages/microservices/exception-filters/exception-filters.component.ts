import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-exception-filters',
  templateUrl: './exception-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MicroservicesExceptionFiltersComponent extends BasePageComponent {}
