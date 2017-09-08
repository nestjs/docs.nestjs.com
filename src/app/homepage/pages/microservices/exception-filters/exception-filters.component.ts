import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-exception-filters',
  templateUrl: './exception-filters.component.html',
  styleUrls: ['./exception-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MicroservicesExceptionFiltersComponent extends BasePageComponent {}