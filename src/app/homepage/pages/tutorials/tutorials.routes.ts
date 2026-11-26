import { Routes } from '@angular/router';
import { TutorialsOverviewComponent } from './overview/overview.component';
import { GraphqlApiComponent } from './graphql-api/graphql-api.component';
import { McpServerComponent } from './mcp-server/mcp-server.component';
import { MicroservicesRabbitmqComponent } from './microservices-rabbitmq/microservices-rabbitmq.component';
import { MongodbCrudApiComponent } from './mongodb-crud-api/mongodb-crud-api.component';
import { GoogleLoginComponent } from './google-login/google-login.component';
import { AiChatBackendComponent } from './ai-chat-backend/ai-chat-backend.component';
import { BackgroundJobsComponent } from './background-jobs/background-jobs.component';
import { BookingSystemComponent } from './booking-system/booking-system.component';
import { EcommerceBackendComponent } from './ecommerce-backend/ecommerce-backend.component';
import { FileUploadsComponent } from './file-uploads/file-uploads.component';
import { MultiTenantSaasComponent } from './multi-tenant-saas/multi-tenant-saas.component';
import { PaymentsWebhooksComponent } from './payments-webhooks/payments-webhooks.component';
import { ProjectManagementApiComponent } from './project-management-api/project-management-api.component';
import { RealtimeChatComponent } from './realtime-chat/realtime-chat.component';
import { RestApiJwtAuthenticationComponent } from './rest-api-jwt-authentication/rest-api-jwt-authentication.component';

export const TUTORIALS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full',
  },
  {
    path: 'overview',
    component: TutorialsOverviewComponent,
    data: { title: 'Node.js backend tutorials with NestJS' },
  },
  {
    path: 'rest-api-jwt-authentication',
    component: RestApiJwtAuthenticationComponent,
    data: { title: 'How to build a REST API with JWT authentication in Node.js' },
  },
  {
    path: 'google-login',
    component: GoogleLoginComponent,
    data: { title: 'How to add Google login to a Node.js API' },
  },
  {
    path: 'mongodb-crud-api',
    component: MongodbCrudApiComponent,
    data: { title: 'How to build a CRUD REST API with Node.js and MongoDB' },
  },
  {
    path: 'graphql-api',
    component: GraphqlApiComponent,
    data: { title: 'How to build a GraphQL API in Node.js' },
  },
  {
    path: 'ecommerce-backend',
    component: EcommerceBackendComponent,
    data: { title: 'How to build an e-commerce backend in Node.js' },
  },
  {
    path: 'multi-tenant-saas',
    component: MultiTenantSaasComponent,
    data: { title: 'How to build a multi-tenant SaaS backend in Node.js' },
  },
  {
    path: 'project-management-api',
    component: ProjectManagementApiComponent,
    data: { title: 'How to build a project-management API in Node.js' },
  },
  {
    path: 'realtime-chat',
    component: RealtimeChatComponent,
    data: { title: 'How to build a real-time chat backend in Node.js' },
  },
  {
    path: 'booking-system',
    component: BookingSystemComponent,
    data: { title: 'How to build a booking system in Node.js without double bookings' },
  },
  {
    path: 'background-jobs',
    component: BackgroundJobsComponent,
    data: { title: 'How to send emails and run background jobs in Node.js' },
  },
  {
    path: 'file-uploads',
    component: FileUploadsComponent,
    data: { title: 'How to build a file upload service in Node.js' },
  },
  {
    path: 'payments-webhooks',
    component: PaymentsWebhooksComponent,
    data: { title: 'How to accept payments with webhooks in Node.js' },
  },
  {
    path: 'ai-chat-backend',
    component: AiChatBackendComponent,
    data: { title: 'How to build an AI chat backend in Node.js' },
  },
  {
    path: 'mcp-server',
    component: McpServerComponent,
    data: { title: 'How to build an MCP server in Node.js' },
  },
  {
    path: 'microservices-rabbitmq',
    component: MicroservicesRabbitmqComponent,
    data: { title: 'How to build microservices in Node.js with RabbitMQ' },
  },
];
