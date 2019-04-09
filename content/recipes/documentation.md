### Documentation

**Compodoc** is a documentation tool for Angular applications. Nest and Angular look very similar, hence, **Compodoc** supports Nest applications as well.

#### Setup

Setting up Compodoc inside an existing Nest project is very simple. With [npm](https://www.npmjs.com/) installed, just add the dev-dependency with the following command in your OS terminal:

```bash
$ npm i -D @compodoc/compodoc
```

#### Generation

Following [the official documentation](https://compodoc.app/guides/usage.html), you can generate your documentation using the below command (npm 6 required):

```bash
$ npx compodoc -p tsconfig.json -s
```

Open your browser and navigate to [http://localhost:8080](http://localhost:8080). You should see an initial Nest CLI project:

<figure><img src="/assets/documentation-compodoc-1.jpg" /></figure>
<figure><img src="/assets/documentation-compodoc-2.jpg" /></figure>

#### Contribute

You can participate and contribute to the Compodoc project [here](https://github.com/compodoc/compodoc).
