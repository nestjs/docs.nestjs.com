### Streaming Files

There won't always be a time where you're sending back JSON or string responses. There may be times where you'd like to send back a file from the server to the client. To do this with Nest, normally you'd do te following:

```ts
@Controller('file')
export class FileController {
  @Get()
  getFile(@Res() res: Response) {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    file.pipe(res);
  }
}
```

to manage sending the file back. This is still doable in Nest, by injecting `@Res()` in the controller, but in doing so you end up losing access to your post-controller interceptor logic. To handle this, you can return a `StreamableFile` instance and under the hood Nest will take care of piping the response.

#### Streamable File

A `StreamableFile` is as class that holds onto the stream that is to be returned. To create a new `StreamableFile`, you can pass either a `Buffer` or a `Stream` to the `StreamableFile` constructor.

> info **hint** The `StreamableFile` class can be imported from `@nestjs/common`.

#### Cross Platform Support

Fastify, by default, can support sending files without needing to `stream.pipe(res)`, so you don't need to use the `StreamableFile` class. However, Nest supports the use of `StreamableFile` in both platform types, so if you end up switching between Express and Fastify there's no need to worry about compatibility between the two engines.

#### Example

```ts
import { Controller, Get, StreamableFile } from '@nestjs/common';
import { createReadStream } from 'fs';
import { join } from 'path';

@Controller('file')
export class FileController {
  @Get()
  getFile(): StreamableFile {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    return new StreamableFile(file);
  }
}
```

This is of course a simple example of returning the `package.json` as a file instead of a JSON, but the idea extends out naturally to images, documents, and any other file type.

