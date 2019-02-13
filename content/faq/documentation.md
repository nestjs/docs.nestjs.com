### Documentation

**Compodoc** is a documentation tool for Angular applications. Nest and Angular are very closed, so **Compodoc** supports also Nest applications.

#### Setup

Setting up Compodoc inside an existing Nest project is very simple. With [npm](https://www.npmjs.com/) installed, just add the dev-dependency with the following commands in your OS terminal:

```bash
  $ npm i -D @compodoc/compodoc
```

#### Generation

Followin [the official documentation](https://compodoc.app/guides/usage.html), you can generate very easily your documentation with this following command in your OS terminal (npm 6 required):

```bash
$ npx compodoc -p tsconfig.json -s
```

Open [http://localhost:8080](http://localhost:8080) in your browser and you should have for an empty Nest CLi project this screenshot:

<figure><img src="/assets/documentation-compodoc-1.jpg" /></figure>
<figure><img src="/assets/documentation-compodoc-2.jpg" /></figure>

#### Contribute

You can participate and contribute to Compodoc project [here](https://github.com/compodoc/compodoc).
