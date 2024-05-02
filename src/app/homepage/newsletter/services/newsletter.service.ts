import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, lastValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class NewsletterService {
  constructor(private readonly httpClient: HttpClient) {}

  addToNewsletter(email: string): Promise<any> {
    const newsletterUrl =
      'https://nbdggbnqnrevwg6xlex3st3vpe0nyhiq.lambda-url.us-east-2.on.aws/?token=db1f899025b5a59a76b6b34b2a013893';
    return lastValueFrom(
      this.httpClient
        .post(newsletterUrl, { email })
        .pipe(catchError(() => EMPTY)),
    );
  }
}
