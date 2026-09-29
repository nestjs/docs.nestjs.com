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

To hash passwords, use `PasswordHasher` from [`@nestjs/authentication`](/security/authentication). It hashes with scrypt from `node:crypto`, at the parameters OWASP recommends (N=2^17, r=8, p=1: about 128 MiB of memory per hash), on the libuv thread pool, so it doesn't block the event loop and needs no native dependency. scrypt is memory-hard, which makes guessing passwords on GPUs far more expensive than with bcrypt.

When your application imports `AuthenticationModule`, `PasswordHasher` is a provider, so inject it where you store and check passwords:

```typescript
import { Injectable } from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';

@Injectable()
export class CredentialsService {
  constructor(private readonly passwordHasher: PasswordHasher) {}

  async hashPassword(password: string) {
    return this.passwordHasher.hash(password);
  }

  async checkPassword(password: string, storedHash: string | undefined) {
    return this.passwordHasher.verify(password, storedHash);
  }
}
```

- `hash()` returns a self-describing string, such as `$scrypt$ln=17,r=8,p=1$<salt>$<hash>`: the parameters and a random salt are stored with the hash, so there is nothing else to keep.
- `verify()` compares in constant time. Pass `undefined` for an unknown user: it checks a dummy hash instead, so the response time doesn't reveal which accounts exist.
- Passwords are Unicode-normalized (NFKC) before hashing, so the same password typed on different keyboards verifies.
- `hash()` refuses an empty password and one over 4 KiB with a `RangeError`, and `verify()` answers `false` for them without hashing. Any other rule, such as a minimum length, is yours to check first.
- `needsRehash()` tells you that a stored hash was made with weaker parameters than the current ones. Check it after a successful `verify()`, and store a new hash while you have the plaintext:

```typescript
if (this.passwordHasher.needsRehash(storedHash)) {
  await this.usersRepository.updatePasswordHash(user.id, await this.passwordHasher.hash(password));
}
```

The cost comes from the module's `password` option: set its `logN` to 18 to double it. It has a ceiling of 1 GiB of memory and 16 times the default work per hash, so with the default `r` of 8, `logN` stops at 20; parameters beyond it throw when the hasher is created, and a stored hash made with them never verifies. Outside the module, create one yourself with `new PasswordHasher()`. In tests, a cheaper instance keeps suites fast, with `logN` set to 10.

> info **Hint** If you'd rather use argon2 or bcrypt, the [argon2](https://www.npmjs.com/package/argon2) and [bcrypt](https://www.npmjs.com/package/bcrypt) packages work with Nest as they are: call their `hash()` and `verify()` (argon2) or `compare()` (bcrypt) functions from your own provider. Both are native modules, and bcrypt reads only the first 72 bytes of a password.
