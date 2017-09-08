import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-guards',
  templateUrl: './guards.component.html',
  styleUrls: ['./guards.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MicroservicesGuardsComponent extends BasePageComponent {}