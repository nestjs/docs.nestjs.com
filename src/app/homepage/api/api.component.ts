import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  ViewEncapsulation,
  ApplicationRef
} from '@angular/core';
import { Location } from '@angular/common';
import { ApiService } from './api.service';
import { BasePageComponent } from '../pages/page/page.component';

@Component({
  templateUrl: './api.component.html',
  styleUrls: ['./api.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ApiComponent extends BasePageComponent implements OnInit {
  @ViewChild('content') contentRef: ElementRef<HTMLDivElement>;
  isDetailPage = false;

  constructor(
    private location: Location,
    private api: ApiService,
    applicationRef: ApplicationRef,
    el: ElementRef
  ) {
    super(applicationRef, el);
  }

  private loadContent(path) {
    if (path === '/api' || path === '/api/') {
      this.isDetailPage = false;
    } else {
      this.isDetailPage = true;
      this.api.getDocument(path).subscribe(content => {
        this.contentRef.nativeElement.innerHTML = content;
        super.initHljs();
      });
    }
  }
  ngOnInit() {
    this.loadContent(this.location.path());
  }
}
