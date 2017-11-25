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
  provide: 'AsyncDbConnection',
  useFactory: async () => {
    const connection = await createConnection(options);
    return connection;
  },
},`;
  }
}