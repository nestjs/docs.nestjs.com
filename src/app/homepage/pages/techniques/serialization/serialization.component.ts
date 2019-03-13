import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-serialization',
  templateUrl: './serialization.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SerializationComponent extends BasePageComponent {}
