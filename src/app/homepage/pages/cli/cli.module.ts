import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CliOverviewComponent } from './overview/overview.component';
import { CliUsagesComponent } from './usages/usages.component';

@NgModule({
  imports: [CommonModule],
  declarations: [CliOverviewComponent, CliUsagesComponent],
  exports: [CliOverviewComponent, CliUsagesComponent],
})
export class CliModule {}
