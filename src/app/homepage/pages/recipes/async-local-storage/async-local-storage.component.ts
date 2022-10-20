
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-async-local-storage',
  templateUrl: './async-local-storage.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsyncLocalStorageComponent extends BasePageComponent {}
