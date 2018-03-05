import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SqlTypeormComponent } from './sql-typeorm.component';

describe('SqlTypeormComponent', () => {
  let component: SqlTypeormComponent;
  let fixture: ComponentFixture<SqlTypeormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SqlTypeormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SqlTypeormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should be created', () => {
    expect(component).toBeTruthy();
  });
});
