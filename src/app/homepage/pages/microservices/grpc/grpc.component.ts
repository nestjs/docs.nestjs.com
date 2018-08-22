import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-grpc',
  templateUrl: './grpc.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrpcComponent extends BasePageComponent {
  get options() {
    return `
const app = await NestFactory.createMicroservice(ApplicationModule, {
  transport: Transport.GRPC,
  options: {
    package: 'hero',
    protoPath: join(__dirname, 'hero/hero.proto'),
  },
});`;
  }

  get heroProto() {
    return `
syntax = "proto3";

package hero;

service HeroService {
  rpc FindOne (HeroById) returns (Hero) {}
}

message HeroById {
  int32 id = 1;
}

message Hero {
  int32 id = 1;
  string name = 2;
}`;
  }

  get grpcHandler() {
    return `
@GrpcMethod('HeroService', 'FindOne')
findOne(data: HeroById, metadata: any): Hero {
  const items = [
    { id: 1, name: 'John' },
    { id: 2, name: 'Doe' },
  ];
  return items.find(({ id }) => id === data.id);
}`;
  }

  get grpcHandlerJs() {
    return `
@GrpcMethod('HeroService', 'FindOne')
findOne(data, metadata) {
  const items = [
    { id: 1, name: 'John' },
    { id: 2, name: 'Doe' },
  ];
  return items.find(({ id }) => id === data.id);
}`;
  }

  get grpcHandlerMethod() {
    return `
@GrpcMethod('HeroService')
findOne(data: HeroById, metadata: any): Hero {
  const items = [
    { id: 1, name: 'John' },
    { id: 2, name: 'Doe' },
  ];
  return items.find(({ id }) => id === data.id);
}`;
  }

  get grpcHandlerMethodJs() {
    return `
@GrpcMethod('HeroService')
findOne(data, metadata) {
  const items = [
    { id: 1, name: 'John' },
    { id: 2, name: 'Doe' },
  ];
  return items.find(({ id }) => id === data.id);
}`;
  }

  get grpcHandlerClass() {
    return `
@Controller()
export class HeroService {
  @GrpcMethod()
  findOne(data: HeroById, metadata: any): Hero {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}`;
  }

  get grpcHandlerClassJs() {
    return `
@Controller()
export class HeroService {
  @GrpcMethod()
  findOne(data, metadata) {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}`;
  }

  get grpcClient() {
    return `
@Client({
  transport: Transport.GRPC,
  options: {
    package: 'hero',
    protoPath: join(__dirname, 'hero/hero.proto'),
  },
})
private readonly client: ClientGrpc;`;
  }

  get grpcClientJs() {
    return `
@Client({
  transport: Transport.GRPC,
  options: {
    package: 'hero',
    protoPath: join(__dirname, 'hero/hero.proto'),
  },
})
client;`;
  }

  get serviceInstance() {
    return `
onModuleInit() {
  this.heroService = this.client.getService<HeroService>('HeroService');
}`;
  }

  get serviceInstanceJs() {
    return `
onModuleInit() {
  this.heroService = this.client.getService('HeroService');
}`;
  }

  get heroService() {
    return `
interface HeroService {
  findOne(data: { id: number }): Observable<any>;
}`;
  }

  get heroController() {
    return `
@Get()
call(): Observable<any> {
  return this.heroService.findOne({ id: 1 });
}`;
  }

  get heroControllerJs() {
    return `
@Get()
call() {
  return this.heroService.findOne({ id: 1 });
}`;
  }
}
