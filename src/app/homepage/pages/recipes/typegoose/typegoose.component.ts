import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-typegoose',
  templateUrl: './typegoose.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypegooseComponent extends BasePageComponent {}
