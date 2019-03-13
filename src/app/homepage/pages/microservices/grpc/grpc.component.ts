import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-grpc',
  templateUrl: './grpc.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrpcComponent extends BasePageComponent {}
