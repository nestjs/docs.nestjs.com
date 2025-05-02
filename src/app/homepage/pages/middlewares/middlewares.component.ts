import { Component } from '@angular/core';
import { BasePageComponent } from '../page/page.component';
import { CopyButtonComponent } from '../../../shared/components/copy-button/copy-button.component';
import { TabsComponent } from '../../../shared/components/tabs/tabs.component';
import { HeaderAnchorDirective } from '../../../shared/directives/header-anchor.directive';
import { ExtensionPipe } from '../../../shared/pipes/extension.pipe';

@Component({
    selector: 'app-middlewares',
    templateUrl: './middlewares.component.html',
    standalone: true,
    imports: [
        CopyButtonComponent,
        TabsComponent,
        HeaderAnchorDirective,
        ExtensionPipe,
    ],
})
export class MiddlewaresComponent extends BasePageComponent {}
