import { Dgeni } from 'dgeni';
import { resolve } from 'path';

const argv = require('yargs').argv;
const packagePaths = argv._;

const packages = packagePaths.map(packagePath => {
  if (packagePath.indexOf('.') === 0) {
    packagePath = resolve(packagePath);
  }
  return require('../' + packagePath).default;
});

new Dgeni(packages)
  .generate()
  .then(docs => {
    console.log(`${docs.length} docs generated.`);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
