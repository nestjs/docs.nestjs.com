import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-workspaces',
  templateUrl: './workspaces.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CliWorkspacesComponent extends BasePageComponent {}
