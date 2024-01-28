import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-social-wrapper',
  templateUrl: './social-wrapper.component.html',
  styleUrls: ['./social-wrapper.component.scss'],
})
export class SocialWrapperComponent implements OnInit {

  public theme: string = '';

  constructor(
    private readonly changeDetectoRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (localStorage.getItem('color-theme')) {
      if (localStorage.getItem('color-theme') === 'light') {
        this.theme = 'light';
      } else {
        this.theme = 'dark';
      }

      // if NOT set via local storage previously
    } else {
      if (document.documentElement.classList.contains('dark')) {
        this.theme = 'light';
      } else {
        this.theme = 'dark';
      }
    }
    this.changeDetectoRef.detectChanges();
  }

  changeTheme(): void {
    // if set via local storage previously
    if (localStorage.getItem('color-theme')) {
      if (localStorage.getItem('color-theme') === 'light') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('color-theme', 'dark');
        this.theme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('color-theme', 'light');
        this.theme = 'light';
      }

      // if NOT set via local storage previously
    } else {
      if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('color-theme', 'light');
        this.theme = 'light';
      } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('color-theme', 'dark');
        this.theme = 'dark';
      }
    }
    this.changeDetectoRef.detectChanges();
  }
}
