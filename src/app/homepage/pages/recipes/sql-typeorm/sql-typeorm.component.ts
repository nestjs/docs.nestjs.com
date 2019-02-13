import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-sql-typeorm',
  templateUrl: './sql-typeorm.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SqlTypeormComponent extends BasePageComponent {}
