import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-cqrs',
  templateUrl: './cqrs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CqrsComponent extends BasePageComponent {}
