import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-interceptors',
  templateUrl: './interceptors.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MicroservicesInterceptorsComponent extends BasePageComponent {
  get example() {
    return `
@UseInterceptors(new TransformInterceptor())
@MessagePattern({ cmd: 'sum' })
sum(data: number[]): number {
  return (data || []).reduce((a, b) => a + b);
}`;
  }
}