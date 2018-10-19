import { ChangeDetectionStrategy, Component } from '@angular/core';
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

  get fileFields() {
    return `
@Post('upload')
@UseInterceptors(FileFieldsInterceptor([
  { name: 'avatar', maxCount: 1 },
  { name: 'background', maxCount: 1 },
]))
uploadFile(@UploadedFiles() files) {
  console.log(files);
}`;
  }

  get fileFieldsJs() {
    return `
@Post('upload')
@Bind(UploadedFiles())
@UseInterceptors(FileFieldsInterceptor([
  { name: 'avatar', maxCount: 1 },
  { name: 'background', maxCount: 1 },
]))
uploadFile(files) {
  console.log(files);
}`;
  }

  get multerModule() {
    return `
MulterModule.register({
  dest: '/upload',
}),`;
  }

  get asyncConfiguration() {
    return `
MulterModule.registerAsync({
  useFactory: () => ({
    dest: '/upload',
  }),
})`;
  }

  get asyncConfigurationFactoryAsync() {
    return `
MulterModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    dest: configService.getString('MULTER_DEST'),
  }),
  inject: [ConfigService],
})`;
  }

  get asyncConfigurationClass() {
    return `
MulterModule.registerAsync({
  useClass: MulterConfigService,
})`;
  }

  get asyncConfigurationClassBody() {
    return `
@Injectable()
class MulterConfigService implements MulterOptionsFactory {
  createMulterOptions(): MulterModuleOptions {
    return {
      dest: '/upload',
    };
  }
}`;
  }

  get asyncConfigurationExisting() {
    return `
MulterModule.registerAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
})`;
  }
}
