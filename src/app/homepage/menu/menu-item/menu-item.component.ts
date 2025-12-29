import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { openCloseAnimation } from '../../../common';
import { RouterLinkActive, RouterLink } from '@angular/router';

@Component({
  selector: 'app-menu-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [openCloseAnimation],
  standalone: true,
  imports: [
    RouterLinkActive,
    RouterLink
  ],
})
export class MenuItemComponent {
  @Input() isOpen = false;
  @Input() children = [];
  @Input() path: string;
  @Input() title: string;
  @Input() icon: string;
  @Input() externalUrl: string;
  @Input() isNew?: boolean;

  public toggle(): void {
    this.isOpen = !this.isOpen;
  }
}
