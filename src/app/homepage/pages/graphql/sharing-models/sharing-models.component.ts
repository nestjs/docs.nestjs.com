import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-sharing-models',
  templateUrl: './sharing-models.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharingModelsComponent extends BasePageComponent {}
