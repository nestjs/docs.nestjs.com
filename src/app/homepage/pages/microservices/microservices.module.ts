import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { BasicsComponent } from './basics/basics.component';
import { CustomTransportComponent } from './custom-transport/custom-transport.component';
import { MicroservicesExceptionFiltersComponent } from './exception-filters/exception-filters.component';
import { GrpcComponent } from './grpc/grpc.component';
import { MicroservicesGuardsComponent } from './guards/guards.component';
import { MicroservicesInterceptorsComponent } from './interceptors/interceptors.component';
import { MqttComponent } from './mqtt/mqtt.component';
import { NatsComponent } from './nats/nats.component';
import { MicroservicesPipesComponent } from './pipes/pipes.component';
import { RabbitMQComponent } from './rabbitmq/rabbitmq.component';
import { KafkaComponent } from './kafka/kafka.component';
import { RedisComponent } from './redis/redis.component';

const routes: Routes = [
  {
    path: 'basics',
    component: BasicsComponent,
    data: { title: 'Microservices' },
  },
  {
    path: 'redis',
    component: RedisComponent,
    data: { title: 'Redis - Microservices' },
  },
  {
    path: 'mqtt',
    component: MqttComponent,
    data: { title: 'MQTT - Microservices' },
  },
  {
    path: 'nats',
    component: NatsComponent,
    data: { title: 'NATS - Microservices' },
  },
  {
    path: 'grpc',
    component: GrpcComponent,
    data: { title: 'gRPC - Microservices' },
  },
  {
    path: 'rabbitmq',
    component: RabbitMQComponent,
    data: { title: 'RabbitMQ - Microservices' },
  },
  {
    path: 'kafka',
    component: KafkaComponent,
    data: { title: 'Kafka - Microservices' },
  },
  {
    path: 'pipes',
    component: MicroservicesPipesComponent,
    data: { title: 'Pipes - Microservices' },
  },
  {
    path: 'exception-filters',
    component: MicroservicesExceptionFiltersComponent,
    data: { title: 'Exception Filters - Microservices' },
  },
  {
    path: 'guards',
    component: MicroservicesGuardsComponent,
    data: { title: 'Guards - Microservices' },
  },
  {
    path: 'interceptors',
    component: MicroservicesInterceptorsComponent,
    data: { title: 'Interceptors - Microservices' },
  },
  {
    path: 'custom-transport',
    component: CustomTransportComponent,
    data: { title: 'Custom transporters - Microservices' },
  },
];

@NgModule({
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes)],
  declarations: [
    BasicsComponent,
    RedisComponent,
    CustomTransportComponent,
    MicroservicesExceptionFiltersComponent,
    MicroservicesPipesComponent,
    MicroservicesInterceptorsComponent,
    MicroservicesGuardsComponent,
    MqttComponent,
    GrpcComponent,
    RabbitMQComponent,
    NatsComponent,
    KafkaComponent,
  ],
})
export class MicroservicesModule {}
