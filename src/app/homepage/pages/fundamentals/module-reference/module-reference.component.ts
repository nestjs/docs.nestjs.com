import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { HeaderAnchorDirective } from '../../../../shared/directives/header-anchor.directive';
import { RouterLink } from '@angular/router';
import { BannerDevtoolsComponent } from '../../../../shared/components/banner-devtools/banner-devtools.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

@Component({
    selector: 'app-module-ref',
    templateUrl: './module-reference.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CopyButtonComponent,
        TabsComponent,
        HeaderAnchorDirective,
        RouterLink,
        BannerDevtoolsComponent,
        ExtensionPipe,
    ],
})
export class ModuleRefComponent extends BasePageComponent {}
