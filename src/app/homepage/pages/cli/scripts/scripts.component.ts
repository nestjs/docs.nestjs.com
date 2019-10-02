import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-scripts',
  templateUrl: './scripts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CliScriptsComponent extends BasePageComponent {}
