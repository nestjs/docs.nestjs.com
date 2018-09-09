import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompressionComponent } from './compression.component';

describe('CompressionComponent', () => {
  let component: CompressionComponent;
  let fixture: ComponentFixture<CompressionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CompressionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompressionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
