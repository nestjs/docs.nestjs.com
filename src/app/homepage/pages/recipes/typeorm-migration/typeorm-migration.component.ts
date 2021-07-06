import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-typeorm-migration',
  templateUrl: './typeorm-migration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeormMigrationComponent extends BasePageComponent {}
