import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-pipes',
  templateUrl: './pipes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MicroservicesPipesComponent extends BasePageComponent {
  get example() {
    return `
@UsePipes(new ValidationPipe())
@MessagePattern({ cmd: 'sum' })
sum(data: number[]): number {
  return (data || []).reduce((a, b) => a + b);
}`;
  }
}