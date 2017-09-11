import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-sql-typeorm',
  templateUrl: './sql-typeorm.component.html',
  styleUrls: ['./sql-typeorm.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SqlTypeormComponent extends BasePageComponent {}