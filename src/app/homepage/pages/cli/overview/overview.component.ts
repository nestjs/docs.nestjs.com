import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CliOverviewComponent extends BasePageComponent {}
