import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploadComponent extends BasePageComponent {
  get singleFile() {
    return `
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
uploadFile(@UploadedFile() file) {
  console.log(file);
}`;
  }

  get singleFileJs() {
    return `
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
@Bind(UploadedFile())
uploadFile(file) {
  console.log(file);
}`;
  }

  get multipleFiles() {
    return `
@Post('upload')
@UseInterceptors(FilesInterceptor('files'))
uploadFile(@UploadedFiles() files) {
  console.log(files);
}`;
  }

  get multipleFilesJs() {
    return `
@Post('upload')
@UseInterceptors(FilesInterceptor('files'))
@Bind(UploadedFiles())
uploadFile(files) {
  console.log(files);
}`;
  }
}
