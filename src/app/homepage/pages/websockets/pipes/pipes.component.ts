import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-pipes',
  templateUrl: './pipes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WsPipesComponent extends BasePageComponent {
  get example() {
    return `
@UsePipes(new ValidationPipe())
@SubscribeMessage('events')
onEvent(client, data: any): WsResponse<any> {
  const event = 'events';
  return { event, data };
}`;
  }
}