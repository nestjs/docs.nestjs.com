### Events

The [Event Emitter](https://www.npmjs.com/package/@nestjs/event-emitter) package (`@nestjs/event-emitter`) provides an observer implementation that lets you subscribe to and listen for events that occur in your application. Events are a good way to decouple different parts of your application, since a single event can have multiple listeners that don't depend on each other.

`EventEmitterModule` internally uses the [eventemitter2](https://github.com/EventEmitter2/EventEmitter2) package.

#### Getting started

First, install the required package:

```shell
$ npm i --save @nestjs/event-emitter
```

Once the installation is complete, import the `EventEmitterModule` into the root `AppModule` and call its `forRoot()` static method, as shown below:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    EventEmitterModule.forRoot()
  ],
})
export class AppModule {}
```

The `.forRoot()` call initializes the event emitter and registers any declarative event listeners that exist within your app. Registration happens in the `onApplicationBootstrap` lifecycle hook, which ensures that all modules have loaded and declared their event listeners. The module is registered as a [global module](/modules#global-modules) by default, so you can inject the event emitter anywhere without importing `EventEmitterModule` again. To change this, set the `global` option to `false`.

To configure the underlying `EventEmitter2` instance, pass a configuration object to the `.forRoot()` method, as follows:

```typescript
EventEmitterModule.forRoot({
  // set this to `true` to use wildcards
  wildcard: false,
  // the delimiter used to segment namespaces
  delimiter: '.',
  // set this to `true` if you want to emit the newListener event
  newListener: false,
  // set this to `true` if you want to emit the removeListener event
  removeListener: false,
  // the maximum amount of listeners that can be assigned to an event
  maxListeners: 10,
  // show event name in memory leak message when more than maximum amount of listeners is assigned
  verboseMemoryLeak: false,
  // disable throwing uncaughtException if an error event is emitted and it has no listeners
  ignoreErrors: false,
});
```

#### Dispatching events

To dispatch (i.e., fire) an event, first inject `EventEmitter2` through the constructor:

```typescript
constructor(private eventEmitter: EventEmitter2) {}
```

> info **Hint** Import `EventEmitter2` from the `@nestjs/event-emitter` package.

Then use it in the class as follows:

```typescript
this.eventEmitter.emit(
  'order.created',
  new OrderCreatedEvent({
    orderId: 1,
    payload: {},
  }),
);
```

#### Listening to events

To declare an event listener, decorate the method that handles the event with the `@OnEvent()` decorator, as follows:

```typescript
@OnEvent('order.created')
handleOrderCreatedEvent(payload: OrderCreatedEvent) {
  // handle and process "OrderCreatedEvent" event
}
```

> info **Hint** If an event listener belongs to a [request-scoped](/fundamentals/injection-scopes) provider, Nest creates a new instance of that provider for every event it handles. The event payload takes the place of the request object, so injecting `REQUEST` in that provider gives you the payload. If the payload you emit is the incoming request object itself (or carries its context ID), set the `inheritRequestContextId` option of `forRoot()` to `true` so that the listener reuses that request's DI sub-tree instead of creating a new one.

The first argument can be a `string` or a `symbol` for a simple event emitter, and a `string | symbol | Array<string | symbol>` for a wildcard emitter.

The optional second argument is a listener options object:

```typescript
export type OnEventOptions = OnOptions & {
  /**
   * If "true", prepends (instead of appends) the given listener to the array of listeners.
   *
   * @see https://github.com/EventEmitter2/EventEmitter2#emitterprependlistenerevent-listener-options
   *
   * @default false
   */
  prependListener?: boolean;

  /**
   * If "true", errors thrown by the onEvent callback are logged instead of rethrown. If "false", they are rethrown.
   *
   * @default true
   */
  suppressErrors?: boolean;
};
```

> info **Hint** To learn more about the `OnOptions` object, see the [`eventemitter2` documentation](https://github.com/EventEmitter2/EventEmitter2#emitteronevent-listener-options-objectboolean).

For example, the following listener runs asynchronously:

```typescript
@OnEvent('order.created', { async: true })
handleOrderCreatedEvent(payload: OrderCreatedEvent) {
  // handle and process "OrderCreatedEvent" event
}
```

To use namespaces and wildcards, pass the `wildcard` option to the `EventEmitterModule#forRoot()` method. When namespaces and wildcards are enabled, events can be either delimiter-separated strings (`foo.bar`) or arrays (`['foo', 'bar']`). You can configure the delimiter with the `delimiter` option. With namespaces enabled, you can subscribe to events using a wildcard:

```typescript
@OnEvent('order.*')
handleOrderEvents(payload: OrderCreatedEvent | OrderRemovedEvent | OrderUpdatedEvent) {
  // handle and process an event
}
```

A single wildcard matches exactly one segment. For example, `order.*` matches the events `order.created` and `order.shipped`, but not `order.delayed.out_of_stock`. To listen to such events, use the multi-level wildcard pattern (i.e., `**`), described in the [EventEmitter2 documentation on multi-level wildcards](https://github.com/EventEmitter2/EventEmitter2#multi-level-wildcards).

With this pattern, you can, for example, create an event listener that catches all events:

```typescript
@OnEvent('**')
handleEverything(payload: any) {
  // handle and process an event
}
```

> info **Hint** The `EventEmitter2` class provides several useful methods for interacting with events, such as `waitFor()` and `onAny()`. See the [EventEmitter2 documentation](https://github.com/EventEmitter2/EventEmitter2) for details.

#### Preventing event loss

Events emitted before or during the `onApplicationBootstrap` lifecycle hook (for example, from constructors or `onModuleInit()` methods) may be missed, because the listeners might not be registered yet.

To avoid this, use the `waitUntilReady()` method of `EventEmitterReadinessWatcher` (exported from `@nestjs/event-emitter`). It returns a promise that resolves once all listeners have been registered. Call it in the `onApplicationBootstrap` lifecycle hook of your provider before emitting events:

```typescript
await this.eventEmitterReadinessWatcher.waitUntilReady();
this.eventEmitter.emit(
  'order.created',
  new OrderCreatedEvent({ orderId: 1, payload: {} }),
);
```

> info **Note** This is only necessary for events emitted before the `onApplicationBootstrap` lifecycle hook completes.

#### Example

A working example is available in the [event emitter sample](https://github.com/nestjs/nest/tree/master/sample/30-event-emitter).
