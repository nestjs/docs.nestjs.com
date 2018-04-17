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
import { Observable } from 'rxjs/Observable';
import { mergeMap, filter, tap } from 'rxjs/operators';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { empty } from 'rxjs/observable/empty';

export class WsAdapter implements WebSocketAdapter {
  constructor(private readonly httpServer) {}

  create(
    port: number,
    options?: any & { namespace?: string; server?: any },
  ): any {
    const { server, ...wsOptions } = options;
    if (port === 0 && this.httpServer) {
      return new ws.Server({
        server: this.httpServer,
        ...wsOptions,
      });
    }
    return server ? server : new ws.Server({ port, ...wsOptions });
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
      return empty();
    }
    const { callback } = messageHandler;
    return process(callback(message.data));
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
import { fromEvent } from 'rxjs/observable/fromEvent';
import { empty } from 'rxjs/observable/empty';

export class WsAdapter {
  constructor(httpServer) {
    this.httpServer = httpServer;
  }

  create(port, options = {}) {
    const { server, ...wsOptions } = options;
    if (port === 0 && this.httpServer) {
      return new ws.Server({
        server: this.httpServer,
        ...wsOptions,
      });
    }
    return server ? server : new ws.Server({ port, ...wsOptions });
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
      return empty();
    }
    const { callback } = messageHandler;
    return process(callback(message.data));
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