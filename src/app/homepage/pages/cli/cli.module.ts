import { NgModule } from '@angular/core';
import { SchematicsComponent } from './schematics/schematics.component';

@NgModule({
  declarations: [
    SchematicsComponent
  ],
  exports: [
    SchematicsComponent
  ]
})
export class CliModule {}
