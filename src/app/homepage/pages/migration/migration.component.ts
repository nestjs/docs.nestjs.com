import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../page/page.component';

@Component({
  selector: 'app-migration',
  templateUrl: './migration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MigrationComponent extends BasePageComponent {}
