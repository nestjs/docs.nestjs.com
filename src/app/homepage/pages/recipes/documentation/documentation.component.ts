import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-documentation',
  templateUrl: './documentation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentationComponent extends BasePageComponent {}
