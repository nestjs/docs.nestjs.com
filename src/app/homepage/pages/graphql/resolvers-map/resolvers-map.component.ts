import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-resolvers-map',
  templateUrl: './resolvers-map.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResolversMapComponent extends BasePageComponent {}
