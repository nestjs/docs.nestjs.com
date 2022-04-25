import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-openapi-migration',
  templateUrl: './migration-guide.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenApiMigrationGuideComponent extends BasePageComponent {}
