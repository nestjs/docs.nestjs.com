import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { openCloseAnimation } from '../../../common';

@Component({
  selector: 'app-versions',
  templateUrl: './versions.component.html',
  styleUrls: ['./versions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    openCloseAnimation
  ]
})
export class VersionsComponent {

  @Input() isOpen = false;
  @Input() icon: string;

  toggle() {
    this.isOpen = !this.isOpen;
  }
}
