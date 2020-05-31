import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-extensions',
  templateUrl: './extensions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtensionsComponent extends BasePageComponent {}
