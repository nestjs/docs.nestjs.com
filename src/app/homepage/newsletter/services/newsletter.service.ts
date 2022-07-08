import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, lastValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class NewsletterService {
  constructor(private readonly httpClient: HttpClient) {}

  addToNewsletter(email: string): Promise<any> {
    const newsletterUrl =
      'https://z93f42xq2l.execute-api.us-east-2.amazonaws.com/Stage/newsletter?token=db1f899025b5a59a76b6b34b2a013893';
    return lastValueFrom(
      this.httpClient
        .post(newsletterUrl, { email })
        .pipe(catchError(() => EMPTY)),
    );
  }
}
