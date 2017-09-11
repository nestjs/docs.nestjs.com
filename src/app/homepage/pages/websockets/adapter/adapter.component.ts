import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-adapter',
  templateUrl: './adapter.component.html',
  styleUrls: ['./adapter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdapterComponent extends BasePageComponent {
  get wsAdapter() {
    return `
import * as WebSocket from 'ws';
import { WebSocketAdapter } from '@nestjs/common';
import { MessageMappingProperties } from '@nestjs/websockets';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/observable/empty';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/filter';

export class WsAdapter implements WebSocketAdapter {
  public create(port: number) {
    return new WebSocket.Server({ port });
  }

  public bindClientConnect(server, callback: (...args: any[]) => void) {
    server.on('connection', callback);
  }

  public bindMessageHandlers(client: WebSocket, handlers: MessageMappingProperties[], process: (data) => Observable<any>) {
    Observable.fromEvent(client, 'message')
      .switchMap((buffer) => this.bindMessageHandler(buffer, handlers, process))
      .filter((result) => !!result)
      .subscribe((response) => client.send(JSON.stringify(response)));
  }

  public bindMessageHandler(buffer, handlers: MessageMappingProperties[], process: (data) => Observable<any>): Observable<any> {
    const data = JSON.parse(buffer.data);
    const messageHandler = handlers.find((handler) => handler.message === data.type);
    if (!messageHandler) {
      return Observable.empty();
    }
    const { callback } = messageHandler;
    return process(callback(data));
  }
}`;
  }

  get setupAdapter() {
    return `
const app = await NestFactory.create(ApplicationModule);
app.useWebSocketAdapter(new WsAdapter());`;
  }
}