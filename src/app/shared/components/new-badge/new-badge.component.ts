import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-new-badge',
  templateUrl: './new-badge.component.html',
  styleUrls: ['./new-badge.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewBadgeComponent {}
