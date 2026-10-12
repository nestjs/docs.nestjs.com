import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiListComponent } from '../../../shared/components/api/api-list/api-list.component';
import { BasePageComponent } from '../page/page.component';

@Component({
  selector: 'app-api',
  templateUrl: './api.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ApiListComponent],
})
export class ApiComponent extends BasePageComponent {}
