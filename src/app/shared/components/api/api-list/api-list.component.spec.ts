import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApiSection } from '../api.service';
import { ApiListComponent } from './api-list.component';

const SECTIONS: ApiSection[] = [
  {
    name: 'nest/packages/common',
    title: 'common',
    path: '/api/common',
    group: 'Fundamentals',
    items: [
      { name: 'injectable', title: 'Injectable', path: '/api/common/Injectable', docType: 'decorator', stability: '' },
      { name: 'validationpipe', title: 'ValidationPipe', path: '/api/common/ValidationPipe', docType: 'pipe', stability: '' },
    ],
  },
  {
    name: 'jwt/lib',
    title: 'jwt',
    path: '/api/jwt',
    group: 'Security',
    items: [
      { name: 'jwtservice', title: 'JwtService', path: '/api/jwt/JwtService', docType: 'injectable', stability: '' },
    ],
  },
];

describe('ApiListComponent', () => {
  let fixture: ComponentFixture<ApiListComponent>;

  const titles = (selector: string) =>
    [...fixture.nativeElement.querySelectorAll(selector)].map((el: HTMLElement) =>
      el.textContent!.trim(),
    );

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ApiListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(ApiListComponent);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController)
      .expectOne('/generated/api/api-list.json')
      .flush(SECTIONS);
    fixture.detectChanges();
  });

  it('groups the packages under their overview group', () => {
    expect(titles('.package-group-title')).toEqual(['Fundamentals', 'Security']);
    expect(titles('.item-title')).toEqual(['Injectable', 'ValidationPipe', 'JwtService']);
  });

  it('filters exports by name and drops packages left empty', () => {
    fixture.componentInstance.setQuery('Pipe');
    fixture.detectChanges();
    expect(titles('.package-group-title')).toEqual(['Fundamentals']);
    expect(titles('.item-title')).toEqual(['ValidationPipe']);
  });

  it('filters exports by type', () => {
    fixture.componentInstance.setType({ value: 'injectable', title: 'Injectable' });
    fixture.detectChanges();
    expect(titles('.item-title')).toEqual(['JwtService']);
  });
});
