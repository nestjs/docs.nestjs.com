### Hot Reload

The highest impact on your application's bootstrapping process is **TypeScript compilation**. Fortunately, with [webpack](https://github.com/webpack/webpack) HMR (Hot-Module Replacement), we don't need to recompile the entire project each time a change occurs. This significantly decreases the amount of time necessary to instantiate your application, and makes iterative development a lot easier.

> warning **Warning** Note that `webpack` won't automatically copy your assets (e.g. `graphql` files) to the `dist` folder. Similarly, `webpack` is not compatible with glob static paths (e.g., the `entities` property in `TypeOrmModule`).

### With CLI

If you are using the [Nest CLI](https://docs.nestjs.com/cli/overview), the configuration process is pretty straightforward. The CLI wraps `webpack`, which allows use of the `HotModuleReplacementPlugin`.

#### Installation

First install the required packages:

```bash
$ npm i --save-dev webpack-node-externals start-server-webpack-plugin
```

#### Configuration

Once the installation is complete, create a `webpack-hmr.config.js` file in the root directory of your application.

```typescript
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const StartServerPlugin = require('start-server-webpack-plugin');

module.exports = function(options) {
  return {
    ...options,
    entry: ['webpack/hot/poll?100', './src/main.ts'],
    watch: true,
    externals: [
      nodeExternals({
        whitelist: ['webpack/hot/poll?100'],
      }),
    ],
    plugins: [
      ...options.plugins,
      new webpack.HotModuleReplacementPlugin(),
      new webpack.WatchIgnorePlugin([/\.js$/, /\.d\.ts$/]),
      new StartServerPlugin({ name: 'main.js' }),
    ],
  };
};
```

This function takes the original object containing the default webpack configuration and returns a modified one with an applied `HotModuleReplacementPlugin` plugin.

#### Hot-Module Replacement

To enable **HMR**, open the application entry file (`main.ts`) and add the following webpack-related instructions:

```typescript
declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
```

To simplify the execution process, add a script to your `package.json` file.

```json
"start:dev": "nest build --watch --webpack --webpackPath webpack-hmr.config.js"
```

Now simply open your command line and run the following command:

```bash
$ npm run start:dev
```

### Without CLI

If you are not using the [Nest CLI](https://docs.nestjs.com/cli/overview), the configuration will be slightly more complex (will require more manual steps).

#### Installation

First install the required packages:

```bash
$ npm i --save-dev webpack webpack-cli webpack-node-externals ts-loader start-server-webpack-plugin
```

#### Configuration

Once the installation is complete, create a `webpack.config.js` file in the root directory of your application.

```typescript
const webpack = require('webpack');
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const StartServerPlugin = require('start-server-webpack-plugin');

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
        test: /.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  mode: 'development',
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new StartServerPlugin({ name: 'main.js' }),
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'server.js',
  },
};
```

This configuration tells webpack a few essential things about your application: location of the entry file, which directory should be used to hold **compiled** files, and what kind of loader we want to use to compile source files. Generally, you should be able to use this file as-is, even if you don't fully understand all of the options.

#### Hot-Module Replacement

To enable **HMR**, open the application entry file (`main.ts`) and add the following webpack-related instructions:

```typescript
declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
```

To simplify the execution process, add a script to your `package.json` file.

```json
"start:dev": "webpack --config webpack.config.js"
```

Now simply open your command line and run the following command:

```bash
$ npm run start:dev
```

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/08-webpack).
