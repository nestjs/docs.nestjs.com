import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { ThemeModeToggleComponent } from '../../shared/components/theme-mode-toggle/theme-mode-toggle.component';
import { SocialWrapperComponent } from '../../common/social-wrapper/social-wrapper.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ThemeModeToggleComponent, SocialWrapperComponent],
})
export class HeaderComponent {
  @Output() toggle = new EventEmitter<void>();
  @Input() isSidebarOpened = true;
}
