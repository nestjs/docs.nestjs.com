import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-versioning',
  templateUrl: './versioning.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersioningComponent extends BasePageComponent {}
