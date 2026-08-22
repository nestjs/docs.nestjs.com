import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';
import { HeaderAnchorDirective } from '../../../../shared/directives/header-anchor.directive';

@Component({
  selector: 'app-observability-mcp-server',
  templateUrl: './mcp-server.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CopyButtonComponent, HeaderAnchorDirective],
})
export class ObservabilityMcpServerComponent extends BasePageComponent {}
