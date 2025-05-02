import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../page/page.component';
import { HeaderAnchorDirective } from '../../../shared/directives/header-anchor.directive';
import { RouterLink } from '@angular/router';
import { BannerDevtoolsComponent } from '../../../shared/components/banner-devtools/banner-devtools.component';
import { CopyButtonComponent } from '../../../shared/components/copy-button/copy-button.component';
import { TabsComponent } from '../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../shared/pipes/extension.pipe';

@Component({
    selector: 'app-interceptors',
    templateUrl: './interceptors.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        HeaderAnchorDirective,
        RouterLink,
        BannerDevtoolsComponent,
        CopyButtonComponent,
        TabsComponent,
        ExtensionPipe,
    ],
})
export class InterceptorsComponent extends BasePageComponent {}
