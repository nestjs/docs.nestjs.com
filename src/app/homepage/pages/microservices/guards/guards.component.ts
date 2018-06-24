import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-guards',
  templateUrl: './guards.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MicroservicesGuardsComponent extends BasePageComponent {
  get example() {
    return `
@UseGuards(AuthGuard)
@MessagePattern({ cmd: 'sum' })
sum(data: number[]): number {
  return (data || []).reduce((a, b) => a + b);
}`;
  }
}