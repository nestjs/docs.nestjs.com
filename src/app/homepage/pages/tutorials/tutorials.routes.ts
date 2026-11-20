import { Routes } from '@angular/router';
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
    path: 'rest-api-jwt-authentication',
    component: RestApiJwtAuthenticationComponent,
    data: { title: 'Build a REST API with JWT authentication - Tutorials' },
  },
  {
    path: 'ecommerce-backend',
    component: EcommerceBackendComponent,
    data: { title: 'Build an e-commerce backend - Tutorials' },
  },
  {
    path: 'multi-tenant-saas',
    component: MultiTenantSaasComponent,
    data: { title: 'Build a multi-tenant SaaS backend - Tutorials' },
  },
  {
    path: 'project-management-api',
    component: ProjectManagementApiComponent,
    data: { title: 'Build a project-management API - Tutorials' },
  },
  {
    path: 'realtime-chat',
    component: RealtimeChatComponent,
    data: { title: 'Build a real-time chat backend - Tutorials' },
  },
  {
    path: 'booking-system',
    component: BookingSystemComponent,
    data: { title: 'Build a booking system - Tutorials' },
  },
  {
    path: 'background-jobs',
    component: BackgroundJobsComponent,
    data: { title: 'Send emails and run background jobs - Tutorials' },
  },
  {
    path: 'file-uploads',
    component: FileUploadsComponent,
    data: { title: 'Build a file upload service - Tutorials' },
  },
  {
    path: 'payments-webhooks',
    component: PaymentsWebhooksComponent,
    data: { title: 'Accept payments with webhooks - Tutorials' },
  },
  {
    path: 'ai-chat-backend',
    component: AiChatBackendComponent,
    data: { title: 'Build an AI chat backend - Tutorials' },
  },
];
