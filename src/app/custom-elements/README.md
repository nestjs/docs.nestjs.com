# Custom Elements

## <code-element>

### Attributes

| Attribute | Type    |
|-----------|---------|
| filename  | string  |

### Usage

```html
<code-element filename="cat.service">
  <pre slot="ts" class="language-typescript">
    <code class="language-typescript">
console.log("Hello");
    </code>
  </pre>
  <pre slot="js" class="language-javascript">
    <code class="language-javascript">
console.log("Hello");
    </code>
  </pre>
</code-element>
```
