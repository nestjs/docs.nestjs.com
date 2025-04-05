import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-testcontainers',
  templateUrl: './testcontainers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestContainersComponent extends BasePageComponent {}
