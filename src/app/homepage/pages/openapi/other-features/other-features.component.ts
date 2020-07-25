import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-openapi-other-features',
  templateUrl: './other-features.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenApiOtherFeaturesComponent extends BasePageComponent {}
