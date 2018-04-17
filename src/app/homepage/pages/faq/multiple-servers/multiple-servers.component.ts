import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-multiple-servers',
  templateUrl: './multiple-servers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MultipleServersComponent extends BasePageComponent {
  get https() {
    return `
const httpsOptions = {
  key: fs.readFileSync('./secrets/private-key.pem'),
  cert: fs.readFileSync('./secrets/public-certificate.pem')
};
const app = await NestFactory.create(ApplicationModule, {
  httpsOptions,
});
await app.listen(3000);`;
  }
  get servers() {
    return `
const httpsOptions = {
  key: fs.readFileSync('./secrets/private-key.pem'),
  cert: fs.readFileSync('./secrets/public-certificate.pem')
};

const server = express();
const app = await NestFactory.create(ApplicationModule, server);
await app.init();

http.createServer(server).listen(3000);
https.createServer(httpsOptions, server).listen(443);
`;
  }
}