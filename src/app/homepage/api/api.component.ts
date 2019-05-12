import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ApiService } from './api.service';
import { tap } from 'rxjs/operators';

@Component({
  templateUrl: './api.component.html',
  styleUrls: ['./api.component.scss']
})
export class ApiComponent implements OnInit {
  @ViewChild('content') contentRef: ElementRef<HTMLDivElement>;
  isDetailPage = false;

  constructor(private location: Location, private api: ApiService) {}

  private loadContent(path) {
    if (path === '/api' || path === '/api/') {
      this.isDetailPage = false;
    } else {
      this.isDetailPage = true;
      this.api
        .getDocument(path)
        .subscribe(
          content => (this.contentRef.nativeElement.innerHTML = content)
        );
    }
  }
  ngOnInit() {
    this.loadContent(this.location.path());
  }
}
