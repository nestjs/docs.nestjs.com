import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-gateways',
  templateUrl: './gateways.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GatewaysComponent extends BasePageComponent {
  get namespace() {
    return `
@WebSocketGateway(81, { namespace: 'events' })`;
  }

  get moreOptions() {
    return `
@WebSocketGateway(81, { transports: ['websocket'] })`;
  }

  get subscribeEventsAck() {
    return `
@SubscribeMessage('events')
onEvent(client, data: string): string {
  return data;
}`;
  }

  get subscribeEventsAckJs() {
    return `
@SubscribeMessage('events')
onEvent(client, data) {
  return data;
}`;
  }

  get subscribeEvents() {
    return `
@SubscribeMessage('events')
onEvent(client, data: any): WsResponse<any> {
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

  return from(response).pipe(
    map(data => ({ event, data })),
  );
}`;
  }

  get streaming() {
    return `
@SubscribeMessage('events')
onEvent(client, data: any): Observable<WsResponse<number>> {
  const event = 'events';
  const response = [1, 2, 3];

  return from(response).pipe(
    map(data => ({ event, data })),
  );
}`;
  }

  get webSocketServer() {
    return `
@WebSocketServer() server;`;
  }

  get clientEmit() {
    return `
socket.emit('events', { name: 'Nest' });`;
  }

  get clientListen() {
    return `
socket.on('events', (data) => console.log(data));`;
  }

  get ackListener() {
    return `
socket.emit('events', { name: 'Nest' }, (data) => console.log(data));`;
  }
}
