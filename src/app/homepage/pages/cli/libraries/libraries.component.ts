import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-libraries',
  templateUrl: './libraries.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CliLibrariesComponent extends BasePageComponent {}
