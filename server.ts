import * as express from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ngExpressEngine } from '@nguniversal/express-engine';
import { provideModuleMap } from '@nguniversal/module-map-ngfactory-loader';

const PORT = process.env.PORT || 8080;
const staticRoot = (file = '') => join(process.cwd(), 'dist', file);
const { AppServerModuleNgFactory, LAZY_MODULE_MAP } = require('./dist-server/main.bundle');
const app = express();
const template = readFileSync(staticRoot('index.html'));

global['Prism'] = null;

// **** Window mocking ****
const domino = require('domino');
const win = domino.createWindow(template);

global['window'] = win;
Object.defineProperty(win.document.body.style, 'transform', {
  value: () => {
    return {
      enumerable: true,
      configurable: true
    };
  },
});
global['document'] = win.document;

app.engine('html', ngExpressEngine({
  bootstrap: AppServerModuleNgFactory,
  providers: [
    provideModuleMap(LAZY_MODULE_MAP)
  ]
}));

app.set('view engine', 'html');
app.set('views', staticRoot());
app.get('*.*', express.static(staticRoot()));
app.get('*', (req, res) => res.render('index', { req }));

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
