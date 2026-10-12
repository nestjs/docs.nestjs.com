import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeModeToggleComponent } from './theme-mode-toggle.component';

describe('ThemeModeToggleComponent', () => {
  let component: ThemeModeToggleComponent;
  let fixture: ComponentFixture<ThemeModeToggleComponent>;

  const iconElement = () =>
    fixture.nativeElement.querySelector('.material-icons') as HTMLElement;
  const icon = () => iconElement().textContent.trim();

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ThemeModeToggleComponent],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('mode');
  });

  function render(): void {
    fixture = TestBed.createComponent(ThemeModeToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', () => {
    render();
    expect(component).toBeTruthy();
  });

  it('starts in dark mode unless light was picked', () => {
    render();
    expect(document.documentElement.getAttribute('mode')).toBe('dark');
    expect(icon()).toBe('light_mode');
  });

  it('starts in the stored theme', () => {
    localStorage.setItem('theme', JSON.stringify('light'));
    render();
    expect(document.documentElement.getAttribute('mode')).toBe('light');
    expect(icon()).toBe('dark_mode');
  });

  // The component is OnPush: the icon only changes if the toggle renders itself
  it('switches the theme and its icon on click', () => {
    render();
    iconElement().click();

    expect(document.documentElement.getAttribute('mode')).toBe('light');
    expect(localStorage.getItem('theme')).toBe(JSON.stringify('light'));
    expect(icon()).toBe('dark_mode');

    iconElement().click();

    expect(document.documentElement.getAttribute('mode')).toBe('dark');
    expect(icon()).toBe('light_mode');
  });
});
