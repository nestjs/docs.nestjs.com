import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-who-uses',
  templateUrl: './who-uses.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./who-uses.component.scss'],
})
export class WhoUsesComponent extends BasePageComponent {}
