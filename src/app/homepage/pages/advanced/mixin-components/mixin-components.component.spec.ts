import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MixinComponentsComponent } from './mixin-components.component';

describe('MixinComponentsComponent', () => {
  let component: MixinComponentsComponent;
  let fixture: ComponentFixture<MixinComponentsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MixinComponentsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MixinComponentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should be created', () => {
    expect(component).toBeTruthy();
  });
});
