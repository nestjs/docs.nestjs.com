import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-serverless',
  templateUrl: './serverless.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerlessComponent extends BasePageComponent {}
