import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CliOverviewComponent } from './overview/overview.component';
import { CliInstallationComponent } from './installation/installation.component';
import { CliUsagesComponent } from './usages/usages.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    CliOverviewComponent,
    CliInstallationComponent,
    CliUsagesComponent
  ],
  exports: [
    CliOverviewComponent,
    CliInstallationComponent,
    CliUsagesComponent
  ]
})
export class CliModule { }
