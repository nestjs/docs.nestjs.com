import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../page/page.component';
import { HeaderAnchorDirective } from '../../../shared/directives/header-anchor.directive';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-introduction',
    templateUrl: './introduction.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [HeaderAnchorDirective, RouterLink]
})
export class IntroductionComponent extends BasePageComponent {}