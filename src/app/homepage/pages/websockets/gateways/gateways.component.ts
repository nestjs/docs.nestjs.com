import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-gateways',
  templateUrl: './gateways.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GatewaysComponent extends BasePageComponent {
  get namespace() {
    return `
@WebSocketGateway({ port: 81, namespace: 'events' })`;
  }

  get subscribeEvents() {
    return `
@SubscribeMessage('events')
onEvent(client, data): WsResponse<any> {
  const event = 'events';
  return { event, data };
}`;
  }

  get subscribeEventsJs() {
    return `
@SubscribeMessage('events')
onEvent(client, data) {
  const event = 'events';
  return { event, data };
}`;
  }

  get streamingJs() {
    return `
@SubscribeMessage('events')
onEvent(client, data) {
  const event = 'events';
  const response = [1, 2, 3];

  return Observable.from(response)
    .map((res) => ({ event, data: res }));
}`;
  }

  get streaming() {
    return `
@SubscribeMessage('events')
onEvent(client, data): Observable<WsResponse<number>> {
  const event = 'events';
  const response = [1, 2, 3];

  return Observable.from(response)
    .map((res) => ({ event, data: res }));
}`;
  }

  get webSocketServer() {
    return `
@WebSocketServer() server;`;
  }
}