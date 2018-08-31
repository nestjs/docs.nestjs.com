import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-compression',
  templateUrl: './compression.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompressionComponent extends BasePageComponent {}
