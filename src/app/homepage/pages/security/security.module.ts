import { Routes } from '@angular/router';
import { AuthenticationComponent } from './authentication/authentication.component';
import { AuthorizationComponent } from './authorization/authorization.component';
import { CorsComponent } from './cors/cors.component';
import { CsrfComponent } from './csrf/csrf.component';
import { EncryptionHashingComponent } from './encryption-hashing/encryption-hashing.component';
import { HelmetComponent } from './helmet/helmet.component';
import { RateLimitingComponent } from './rate-limiting/rate-limiting.component';

export const SECURITY_ROUTES: Routes = [
  {
    path: 'authentication',
    component: AuthenticationComponent,
    data: { title: 'Authentication' },
  },
  {
    path: 'cors',
    component: CorsComponent,
    data: { title: 'CORS' },
  },
  {
    path: 'helmet',
    component: HelmetComponent,
    data: { title: 'Helmet' },
  },
  {
    path: 'encryption-and-hashing',
    component: EncryptionHashingComponent,
    data: { title: 'Encryption and Hashing' },
  },
  {
    path: 'csrf',
    component: CsrfComponent,
    data: { title: 'CSRF' },
  },
  {
    path: 'rate-limiting',
    component: RateLimitingComponent,
    data: { title: 'Rate Limiting' },
  },
  {
    path: 'authorization',
    component: AuthorizationComponent,
    data: { title: 'Authorization' },
  },
];
