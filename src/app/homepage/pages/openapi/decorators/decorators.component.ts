import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BasePageComponent } from '../../page/page.component';

@Component({
    selector: 'app-decorators',
    templateUrl: './decorators.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [RouterLink],
})
export class DecoratorsComponent extends BasePageComponent {}
