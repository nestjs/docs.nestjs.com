import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-hot-reload',
  templateUrl: './hot-reload.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotReloadComponent extends BasePageComponent {
  get packages() {
    return `
$ npm i --save-dev webpack webpack-cli webpack-node-externals`;
  }

  get configuration() {
    return `
const webpack = require('webpack');
const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: ['webpack/hot/poll?100', './src/main.ts'],
  watch: true,
  target: 'node',
  externals: [
    nodeExternals({
      whitelist: ['webpack/hot/poll?100'],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  mode: 'development',
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [new webpack.HotModuleReplacementPlugin()],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'server.js',
  },
};`
  }

  get main() {
    return `
declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule);
  await app.listen(3000);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();`;
  }

  get scripts() {
    return `
"start": "node dist/server",
"webpack": "webpack --config webpack.config.js"`;
  }

  get webpackStart() {
    return `
$ npm run webpack`;
  }

  get start() {
    return `
$ npm run start`;
  }
}
