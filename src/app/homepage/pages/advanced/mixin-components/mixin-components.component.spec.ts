import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MixinComponentsComponent } from './mixin-components.component';

describe('MixinComponentsComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [ MixinComponentsComponent ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<MixinComponentsComponent>;
  let component: MixinComponentsComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(MixinComponentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
