import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { openCloseAnimation } from '../../../common';
import { VersionsService } from './services/versions.service';

export default class Versions {
  version: String;
}

@Component({
  selector: 'app-versions',
  templateUrl: './versions.component.html',
  styleUrls: ['./versions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [openCloseAnimation],
})
export class VersionsComponent implements OnInit {
  @Input() isOpen = false;
  @Input() icon: string;

  versions: Versions[];
  linkLatest: boolean = false;

  constructor(private readonly versionsService: VersionsService) {}

  toggle() {
    this.isOpen = !this.isOpen;
  }

  ngOnInit(): void {
    this.versionsService.addToVersionLatest().subscribe({
      next: (data) => {
        this.versions = data['version'];
      },
      error: (error) => {
        this.linkLatest = true;
        throw error;
      },
    });
  }
}
