import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SchemaStitchingComponent } from './schema-stitching.component';

describe('SchemaStitchingComponent', () => {
  let component: SchemaStitchingComponent;
  let fixture: ComponentFixture<SchemaStitchingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SchemaStitchingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaStitchingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
