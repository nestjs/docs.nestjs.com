import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { ApiComponent } from './api.component';
import { ApiService } from './api.service';
import { Routes, RouterModule } from '@angular/router';
import { ApiListComponent } from './api-list/api-list.component';

const routes: Routes = [
  {
    path: '**',
    component: ApiComponent,
    data: {
      title: 'API'
    },
  }
];

@NgModule({
  imports: [HttpClientModule, CommonModule, RouterModule.forChild(routes)],
  declarations: [ApiComponent,  ApiListComponent],
  providers: [ApiService]
})
export class ApiModule {}
