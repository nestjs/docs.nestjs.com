### Encryption and Hashing

**Encryption** is the process of encoding information. This process converts the original representation of the information, known as plaintext, into an alternative form known as ciphertext. Ideally, only authorized parties can decipher a ciphertext back to plaintext and access the original information. Encryption does not itself prevent interference, but it denies the intelligible content to a would-be interceptor. Encryption is a two-way function: what is encrypted can be decrypted with the proper key.

**Hashing** is the process of converting a given key into another value. A hash function generates the new value according to a mathematical algorithm. Once a value has been hashed, it should be impossible to go from the output back to the input.

#### Encryption

Node.js provides a built-in [crypto module](https://nodejs.org/api/crypto.html) that you can use to encrypt and decrypt strings, numbers, buffers, streams, and more. Nest does not provide an additional package on top of this module, to avoid introducing unnecessary abstractions.

As an example, let's use the AES (Advanced Encryption Standard) `'aes-256-ctr'` algorithm, which uses the CTR encryption mode.

```typescript
import { createCipheriv, randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';

const iv = randomBytes(16);
const password = 'Password used to generate key';

// The key length is dependent on the algorithm.
// In this case for aes256, it is 32 bytes.
const key = (await promisify(scrypt)(password, 'salt', 32)) as Buffer;
const cipher = createCipheriv('aes-256-ctr', key, iv);

const textToEncrypt = 'Nest';
const encryptedText = Buffer.concat([
  cipher.update(textToEncrypt),
  cipher.final(),
]);
```

To decrypt the `encryptedText` value:

```typescript
import { createDecipheriv } from 'node:crypto';

const decipher = createDecipheriv('aes-256-ctr', key, iv);
const decryptedText = Buffer.concat([
  decipher.update(encryptedText),
  decipher.final(),
]);
```

#### Hashing

For hashing, we recommend either the [bcrypt](https://www.npmjs.com/package/bcrypt) or the [argon2](https://www.npmjs.com/package/argon2) package. Nest does not provide additional wrappers on top of these modules, to avoid introducing unnecessary abstractions and to keep the learning curve short.

As an example, let's use `bcrypt` to hash a password.

First, install the required packages:

```shell
$ npm i bcrypt
$ npm i -D @types/bcrypt
```

Once the installation is complete, use the `hash()` function, as follows:

```typescript
import bcrypt from 'bcrypt';

const saltOrRounds = 10;
const password = 'random_password';
const hash = await bcrypt.hash(password, saltOrRounds);
```

To generate a salt, use the `genSalt()` function:

```typescript
const salt = await bcrypt.genSalt();
```

To check a password against a hash, use the `compare()` function:

```typescript
const isMatch = await bcrypt.compare(password, hash);
```

See the [bcrypt package documentation](https://www.npmjs.com/package/bcrypt) for the full list of available functions.
