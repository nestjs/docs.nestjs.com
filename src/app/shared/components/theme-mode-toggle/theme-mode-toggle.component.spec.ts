import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeModeToggleComponent } from './theme-mode-toggle.component';

describe('ThemeModeToggleComponent', () => {
  let component: ThemeModeToggleComponent;
  let fixture: ComponentFixture<ThemeModeToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [ThemeModeToggleComponent],
}).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ThemeModeToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
