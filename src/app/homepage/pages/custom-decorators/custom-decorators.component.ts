import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../page/page.component';

@Component({
  selector: 'app-custom-decorators',
  templateUrl: './custom-decorators.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomDecoratorsComponent extends BasePageComponent {}
