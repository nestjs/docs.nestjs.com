import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { openCloseAnimation } from '../../../common';
import { NavItem } from '../../../shared/nav/nav-items';
import { RouterLinkActive, RouterLink } from '@angular/router';
import { NewBadgeComponent } from '../../../shared/components/new-badge/new-badge.component';

@Component({
  selector: 'app-menu-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [openCloseAnimation],
  standalone: true,
  imports: [RouterLinkActive, RouterLink, NewBadgeComponent],
})
export class MenuItemComponent {
  @Input() isOpen = false;
  @Input() children: NavItem[] = [];
  @Input() path: string;
  @Input() title: string;
  @Input() icon: string;
  @Input() externalUrl: string;
  @Input() isNew?: boolean;

  public toggle(): void {
    this.isOpen = !this.isOpen;
  }
}
