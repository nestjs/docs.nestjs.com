import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-async-components',
  templateUrl: './async-components.component.html',
  styleUrls: ['./async-components.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AsyncComponentsComponent extends BasePageComponent {
  get asyncComponent() {
    return `
{
  provide: 'AsyncComponent',
  useFactory: async () => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return null;
  },
},`;
  }
}