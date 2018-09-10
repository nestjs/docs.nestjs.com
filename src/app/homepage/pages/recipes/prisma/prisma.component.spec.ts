import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { PrismaComponent } from './prisma.component';

describe('PrismaComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        PrismaComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<PrismaComponent>;
  let component: PrismaComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(PrismaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
