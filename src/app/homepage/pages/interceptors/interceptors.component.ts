import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../page/page.component';

@Component({
  selector: 'app-interceptors',
  templateUrl: './interceptors.component.html',
  styleUrls: ['./interceptors.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InterceptorsComponent extends BasePageComponent {
}