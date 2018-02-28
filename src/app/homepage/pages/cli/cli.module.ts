import { NgModule } from '@angular/core';
import { CliComponent } from './cli.component';

@NgModule({
  declarations: [
    CliComponent
  ],
  exports: [
    CliComponent
  ]
})
export class CliModule {}
