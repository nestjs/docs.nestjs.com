import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-sql',
  templateUrl: './sql.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SqlComponent extends BasePageComponent {}
