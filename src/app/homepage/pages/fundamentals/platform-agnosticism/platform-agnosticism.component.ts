import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-platform-agnosticism',
  templateUrl: './platform-agnosticism.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformAgnosticismComponent extends BasePageComponent {}
