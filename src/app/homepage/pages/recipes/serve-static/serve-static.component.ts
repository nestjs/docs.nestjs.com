import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-serve-static',
  templateUrl: './serve-static.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServeStaticComponent extends BasePageComponent {}
