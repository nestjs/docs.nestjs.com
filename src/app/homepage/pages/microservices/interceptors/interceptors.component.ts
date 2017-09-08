import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-interceptors',
  templateUrl: './interceptors.component.html',
  styleUrls: ['./interceptors.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MicroservicesInterceptorsComponent extends BasePageComponent {}