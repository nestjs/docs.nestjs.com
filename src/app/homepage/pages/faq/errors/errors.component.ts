import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';
import { HeaderAnchorDirective } from '../../../../shared/directives/header-anchor.directive';
import { RouterLink } from '@angular/router';
import { BannerObserveComponent } from '../../../../shared/components/banner-observe/banner-observe.component';

@Component({
    selector: 'app-errors',
    templateUrl: './errors.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        HeaderAnchorDirective,
        RouterLink,
        BannerObserveComponent,
    ],
})
export class ErrorsComponent extends BasePageComponent {}
