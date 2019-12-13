import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { AuthenticationComponent } from './authentication/authentication.component';
import { CachingComponent } from './caching/caching.component';
import { CompressionComponent } from './compression/compression.component';
import { ConfigurationComponent } from './configuration/configuration.component';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { HttpModuleComponent } from './http-module/http-module.component';
import { LoggerComponent } from './logger/logger.component';
import { MongoComponent } from './mongo/mongo.component';
import { MvcComponent } from './mvc/mvc.component';
import { PerformanceComponent } from './performance/performance.component';
import { SecurityComponent } from './security/security.component';
import { SerializationComponent } from './serialization/serialization.component';
import { SqlComponent } from './sql/sql.component';
import { ValidationComponent } from './validation/validation.component';

const routes: Routes = [
  {
    path: 'authentication',
    component: AuthenticationComponent,
    data: { title: 'Authentication' },
  },
  {
    path: 'mvc',
    component: MvcComponent,
    data: { title: 'MVC' },
  },
  {
    path: 'serialization',
    component: SerializationComponent,
    data: { title: 'Serialization' },
  },
  {
    path: 'caching',
    component: CachingComponent,
    data: { title: 'Caching' },
  },
  {
    path: 'validation',
    component: ValidationComponent,
    data: { title: 'Validation' },
  },
  {
    path: 'sql',
    redirectTo: 'database',
  },
  {
    path: 'database',
    component: SqlComponent,
    data: { title: 'Database' },
  },
  {
    path: 'mongodb',
    component: MongoComponent,
    data: { title: 'MongoDB' },
  },
  {
    path: 'file-upload',
    component: FileUploadComponent,
    data: { title: 'File upload' },
  },
  {
    path: 'logger',
    component: LoggerComponent,
    data: { title: 'Logger' },
  },
  {
    path: 'performance',
    component: PerformanceComponent,
    data: { title: 'Performance (Fastify)' },
  },
  {
    path: 'http-module',
    component: HttpModuleComponent,
    data: { title: 'HTTP module' },
  },
  {
    path: 'configuration',
    component: ConfigurationComponent,
    data: { title: 'Configuration' },
  },
  {
    path: 'security',
    component: SecurityComponent,
    data: { title: 'Security' },
  },
  {
    path: 'compression',
    component: CompressionComponent,
    data: { title: 'Compression' },
  },
  {
    path: 'hot-reload',
    redirectTo: '/recipes/hot-reload',
  },
];

@NgModule({
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes)],
  declarations: [
    SqlComponent,
    MvcComponent,
    MongoComponent,
    AuthenticationComponent,
    SecurityComponent,
    LoggerComponent,
    PerformanceComponent,
    FileUploadComponent,
    HttpModuleComponent,
    ConfigurationComponent,
    CompressionComponent,
    ValidationComponent,
    CachingComponent,
    SerializationComponent,
  ],
})
export class TechniquesModule {}
