### Server-Sent Events

You can enable Server-Sent events on a route with Nest. This can be used to push real-time updates to your client using HTTP. More informations about this specification can be found [on the whatwg website](https://html.spec.whatwg.org/multipage/server-sent-events.html).

#### Usage

In this example, we set a route named `/sse` that will allow you to propagate real time updates. These events can be listened to using the Javascript [EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource). On the `/` route, for the sake of the example, we're logging the received data in the browser's console.

Note the `@Sse` annotation that hooks the Server-Sent events mechanism on the choosed path:

```
@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return `
    <script type="text/javascript">
      const ee = new EventSource('/sse')
      ee.onmessage = ({data}) => {
        console.log('New message', JSON.parse(data))
      }
    </script>
    `;
  }

  @Sse('/sse')
  sse(): Observable<MessageEvent> {
    return interval(1000).pipe(map((_) => ({ data: { hello: 'world' } })));
  }
}
```

The events are sent via an Observable emitting a `MessageEvent`. The MessageEvent should respect the following interface to match the specification:

```
export interface MessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}
```

You can find a sample of a working example on [Nest repository](https://github.com/nestjs/nest/tree/master/sample/28-sse).
