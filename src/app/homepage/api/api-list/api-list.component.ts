import { Component, OnInit } from '@angular/core';
import { Observable, from } from 'rxjs';
import { ApiSection, ApiService } from '../api.service';
import { map, switchMap } from 'rxjs/operators';
import { isNgTemplate } from '@angular/compiler';

@Component({
  selector: 'app-api-list',
  templateUrl: './api-list.component.html',
  styleUrls: ['./api-list.component.scss']
})
export class ApiListComponent implements OnInit {
  public apiSection: Observable<ApiSection[]>;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.apiSection = this.api.getApiList();
  }
}
