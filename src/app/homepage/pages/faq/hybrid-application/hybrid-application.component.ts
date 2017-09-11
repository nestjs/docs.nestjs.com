import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-hybrid-application',
  templateUrl: './hybrid-application.component.html',
  styleUrls: ['./hybrid-application.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HybridApplicationComponent extends BasePageComponent {}
