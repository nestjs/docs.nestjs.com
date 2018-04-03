import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-guards',
  templateUrl: './guards.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WsGuardsComponent extends BasePageComponent {}