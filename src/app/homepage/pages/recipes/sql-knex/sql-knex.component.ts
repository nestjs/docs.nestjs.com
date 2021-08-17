import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-sql-knex',
  templateUrl: './sql-knex.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SqlKnexComponent extends BasePageComponent {}
