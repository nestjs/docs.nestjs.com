import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RedisComponent } from './redis.component';

describe('RedisComponent', () => {
  let component: RedisComponent;
  let fixture: ComponentFixture<RedisComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RedisComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RedisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
