import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-e2e-testing',
  templateUrl: './e2e-testing.component.html',
  styleUrls: ['./e2e-testing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class E2eTestingComponent extends BasePageComponent {}
