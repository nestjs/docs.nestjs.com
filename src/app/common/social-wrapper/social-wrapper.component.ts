import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-social-wrapper',
  templateUrl: './social-wrapper.component.html',
  styleUrls: ['./social-wrapper.component.scss'],
})
export class SocialWrapperComponent implements OnInit {
  githubStars: string = '';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const owner = 'nestjs';
    const repo = 'nest';
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

    this.http.get<any>(apiUrl).subscribe({
      next: (data) => {
        const stars = data.stargazers_count;
        this.githubStars = this.formatStars(stars);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('GitHub API error:', err);
      },
    });
  }

  private formatStars(count: number): string {
    if (count >= 1_000_000) {
      return (count / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    } else if (count >= 1_000) {
      return (count / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
    } else {
      return count.toString();
    }
  }
}
