import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-custom-transport',
  templateUrl: './custom-transport.component.html',
  styleUrls: ['./custom-transport.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomTransportComponent extends BasePageComponent {}
