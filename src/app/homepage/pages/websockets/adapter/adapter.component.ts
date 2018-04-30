import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-adapter',
  templateUrl: './adapter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdapterComponent extends BasePageComponent {
  get wsAdapter() {
    return `
import * as WebSocket from 'ws';
import { WebSocketAdapter, MessageMappingProperties } from '@nestjs/common';
import { Observable, fromEvent, empty } from 'rxjs';
import { mergeMap, filter, tap } from 'rxjs/operators';

export class WsAdapter implements WebSocketAdapter {
  constructor(private readonly httpServer) {}

  create(port: number, options: any = {}): any {
    return new ws.Server({ port, ...options });
  }

  bindClientConnect(server, callback: (...args) => void) {
    server.on('connection', callback);
  }

  bindMessageHandlers(
    client: WebSocket,
    handlers: MessageMappingProperties[],
    process: (data: any) => Observable<any>,
  ) {
    fromEvent(client, 'message')
      .pipe(
        mergeMap(data => this.bindMessageHandler(data, handlers, process)),
        filter(result => !!result),
      )
      .subscribe(response => client.send(JSON.stringify(response)));
  }

  bindMessageHandler(
    buffer,
    handlers: MessageMappingProperties[],
    process: (data: any) => Observable<any>,
  ): Observable<any> {
    const message = JSON.parse(buffer.data);
    const messageHandler = handlers.find(
      handler => handler.message === message.event,
    );
    if (!messageHandler) {
      return empty;
    }
    return process(messageHandler.callback(message.data));
  }

  close(server) {
    server.close();
  }
}`;
  }

  get wsAdapterJs() {
    return `
import * as WebSocket from 'ws';
import { mergeMap, filter, tap } from 'rxjs/operators';
import { fromEvent, empty } from 'rxjs';

export class WsAdapter {
  constructor(httpServer) {
    this.httpServer = httpServer;
  }

  create(port, options = {}) {
    return new ws.Server({ port, ...options });
  }

  bindClientConnect(server, callback) {
    server.on('connection', callback);
  }

  bindMessageHandlers(client, handlers, process) {
    fromEvent(client, 'message')
      .pipe(
        mergeMap(data => this.bindMessageHandler(data, handlers, process)),
        filter(result => !!result),
      )
      .subscribe(response => client.send(JSON.stringify(response)));
  }

  bindMessageHandler(buffer, handlers, process) {
    const message = JSON.parse(buffer.data);
    const messageHandler = handlers.find(
      handler => handler.message === message.event,
    );
    if (!messageHandler) {
      return empty;
    }
    return process(messageHandler.callback(message.data));
  }

  close(server) {
    server.close();
  }
}`;
  }

  get setupAdapter() {
    return `
const app = await NestFactory.create(ApplicationModule);
app.useWebSocketAdapter(new WsAdapter());`;
  }
}