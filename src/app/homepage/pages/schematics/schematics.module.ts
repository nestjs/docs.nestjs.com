import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchematicsOverviewComponent } from './overview/overview.component';
import { SchematicsInstallationComponent } from './installation/installation.component';
import { SchematicsUsagesComponent } from './usages/usages.component';
import { SchematicsCollectionComponent } from './collection/collection.component';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    RouterModule
  ],
  declarations: [
    SchematicsOverviewComponent,
    SchematicsInstallationComponent,
    SchematicsUsagesComponent,
    SchematicsCollectionComponent
  ],
  exports: [
    SchematicsOverviewComponent,
    SchematicsInstallationComponent,
    SchematicsUsagesComponent,
    SchematicsCollectionComponent
  ],
})
export class SchematicsModule {
}
