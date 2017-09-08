import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-basics',
  templateUrl: './basics.component.html',
  styleUrls: ['./basics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BasicsComponent extends BasePageComponent {}