import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-provider-scopes',
  templateUrl: './provider-scopes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderScopesComponent extends BasePageComponent {}
