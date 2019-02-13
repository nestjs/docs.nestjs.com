import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-sql-sequelize',
  templateUrl: './sql-sequelize.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SqlSequelizeComponent extends BasePageComponent {}
