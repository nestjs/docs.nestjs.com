import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-platform-agnosticism',
  templateUrl: './platform-agnosticism.component.html',
  styleUrls: ['./platform-agnosticism.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlatformAgnosticismComponent extends BasePageComponent {

}
