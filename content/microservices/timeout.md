### Timeout

Sometimes, microservices are down or not available. For such cases, a timeout is required. If the microservice does not respond to the request within a certain time, an Exception is thrown, which can be caught and an error message will be displayed.

To solve this problem you have to install [rxjs](https://github.com/ReactiveX/rxjs) package:

```bash
npm install rxjs
```

Then just add a call of timeout method to the pipe:

```typescript
@@filename()
import { timeout } from 'rxjs/operators';
// ...
this.client
      .send<TResult, TInput>(pattern, data)
      .pipe(timeout(5000))
      .toPromise();
@@switch
import { timeout } from 'rxjs/operators';
// ...
this.client
      .send(pattern, data)
      .pipe(timeout(5000))
      .toPromise();
```

After 5 seconds, if microservice isn't responding, it will throw an error:
```bash
[Nest] 17544   - 05/24/2020, 8:08:27 AM   [ExceptionsHandler] Timeout has occurred +5009ms
```