import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-menu-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuItemComponent {
  @Input() isOpen = false;
  @Input() children = [];
  @Input() path: string;
  @Input() title: string;
  @Input() externalUrl: string;

  toggle() {
    this.isOpen = !this.isOpen;
  }
}
