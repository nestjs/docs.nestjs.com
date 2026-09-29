import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { ThemeModeToggleComponent } from '../../shared/components/theme-mode-toggle/theme-mode-toggle.component';
import { SocialWrapperComponent } from '../../common/social-wrapper/social-wrapper.component';
import { NewBadgeComponent } from '../../shared/components/new-badge/new-badge.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ThemeModeToggleComponent, SocialWrapperComponent, NewBadgeComponent],
})
export class HeaderComponent {
  @Output() toggle = new EventEmitter<void>();
  @Input() isSidebarOpened = true;
}
