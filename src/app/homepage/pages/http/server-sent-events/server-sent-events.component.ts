import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BasePageComponent } from '../../page/page.component';
import { HeaderAnchorDirective } from '../../../../shared/directives/header-anchor.directive';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';

@Component({
    selector: 'app-sse',
    templateUrl: './server-sent-events.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [HeaderAnchorDirective, CopyButtonComponent, RouterLink],
})
export class ServerSentEventsComponent extends BasePageComponent {}
