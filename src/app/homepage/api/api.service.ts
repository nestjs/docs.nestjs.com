import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface ApiItem {
  name: string;
  title: string;
  path: string;
  docType: string;
}

export interface ApiSection {
  name: string;
  title: string;
  path: string;
  items: ApiItem[];
}

@Injectable()
export class ApiService {
  constructor(private http: HttpClient) {}

  getApiList() {
    return this.http.get<ApiSection[]>('/generated/docs/api/api-list.json');
  }

  getDocument(path) {
    let requestingFile = path.replace('/api', '');
    requestingFile = requestingFile.endsWith('/')
      ? requestingFile
      : requestingFile + '/';
    return this.http.get(
      `/generated/docs/api/partials/modules/${requestingFile}index.html`,
      {
        responseType: 'text'
      }
    );
  }
}
