import { Routes } from '@angular/router';
import { EcommerceBackendComponent } from './ecommerce-backend/ecommerce-backend.component';
import { RestApiJwtAuthenticationComponent } from './rest-api-jwt-authentication/rest-api-jwt-authentication.component';

export const GUIDES_ROUTES: Routes = [
  {
    path: 'rest-api-jwt-authentication',
    component: RestApiJwtAuthenticationComponent,
    data: { title: 'Build a REST API with JWT authentication - Guides' },
  },
  {
    path: 'ecommerce-backend',
    component: EcommerceBackendComponent,
    data: { title: 'Build an e-commerce backend - Guides' },
  },
];
