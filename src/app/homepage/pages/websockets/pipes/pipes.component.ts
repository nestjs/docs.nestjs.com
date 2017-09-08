import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-pipes',
  templateUrl: './pipes.component.html',
  styleUrls: ['./pipes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WsPipesComponent extends BasePageComponent {}