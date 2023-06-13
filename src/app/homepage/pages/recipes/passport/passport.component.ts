import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-passport',
  templateUrl: './passport.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PassportComponent extends BasePageComponent {}
