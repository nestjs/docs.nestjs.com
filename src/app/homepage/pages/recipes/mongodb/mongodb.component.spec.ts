import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MongodbComponent } from './mongodb.component';

describe('MongodbComponent', () => {
  let component: MongodbComponent;
  let fixture: ComponentFixture<MongodbComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MongodbComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MongodbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
