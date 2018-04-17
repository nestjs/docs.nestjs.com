import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-usages',
  templateUrl: './usages.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CliUsagesComponent extends BasePageComponent {}
