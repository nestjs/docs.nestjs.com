import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SqlTypeormComponent } from './sql-typeorm.component';

describe('SqlTypeormComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [ SqlTypeormComponent ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<SqlTypeormComponent>;
  let component: SqlTypeormComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(SqlTypeormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
