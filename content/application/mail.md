### Mail

When a customer places an order at an online store for cat food and supplies, they expect a confirmation email within a minute: the items, the total, a link to the order, and the invoice as a PDF. Sending that email well takes more than a call to an SMTP library:

- **The HTML must be safe.** A product name or a customer name ends up in the markup. Unescaped, a name like `<script>` or a stray `&` breaks the layout, or worse.
- **The mail must survive failures.** Mail servers greylist, rate-limit and go down. A send that fails inside the request either fails an order that already committed, or loses the email.
- **Tests must see what was sent.** A test for "the customer gets a confirmation with a link to the order" needs the rendered mail and its links, not a mocked method call.

`@nestjs/mail` covers these. Mail classes are injectable providers that render a subject and a body from typed data, so they can inject your other providers, such as a repository or a PDF renderer. The body comes from an HTML template file, rendered by a small built-in engine that escapes every value it inserts, or by Handlebars or any other engine you plug in. Transports deliver the result: SMTP, written on `node:net` and `node:tls`, and Resend, Postmark, SendGrid and Amazon SES over their HTTP APIs. Tests swap the transport for an in-memory one and read the mails it received. The package has no dependencies beyond Nest itself.

In this tutorial, you'll add order confirmation emails to the store's order API:

- Development writes every mail to an `.eml` file instead of sending it.
- The confirmation is a mail class that renders an HTML template, in a layout that every mail shares, with the invoice attached and the logo inline.
- A preview route shows the mail in a browser without sending it.
- Mail goes out after the order commits, through the outbox, with retries and dead letters.
- Production sends through SMTP or Resend, picked by an environment variable.

#### Installation

To get started, install the required dependency:

```bash
$ npm i --save @nestjs/mail
```

#### Register the mail module

Register `MailModule` in the root module, next to `DrizzleModule`. The mail tutorial needs the database for the customers and their orders, and for the outbox's tables, through which the mail is [sent after the order commits](/application/mail#send-after-the-order-commits). In development, `FileMailTransport` writes each mail to a file in `var/mail` instead of sending it, and `FileTemplateEngine` renders the mail bodies from HTML files in `mail/templates`. The feature modules it imports are built in the following sections:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { DrizzleModule } from '@nestjs/drizzle';
import { FileMailTransport, FileTemplateEngine, MailModule } from '@nestjs/mail';
import { drizzle } from 'drizzle-orm/node-postgres';
import { join } from 'node:path';
import * as schema from './database/schema.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { OrdersModule } from './orders/orders.module.js';

@Module({
  imports: [
    DrizzleModule.forRootAsync({
      // A pg pool on DATABASE_URL: the customers and orders, and the outbox's tables
      useFactory: () => ({ drizzle, connection: process.env.DATABASE_URL!, schema }),
    }),
    MailModule.forRoot({
      // Development: every mail becomes an .eml file in var/mail instead of leaving the machine
      transport: new FileMailTransport({ directory: 'var/mail' }),
      // Mail bodies are HTML files in mail/templates, wrapped in mail/templates/layout.html
      templates: new FileTemplateEngine({
        dir: join(import.meta.dirname, 'mail/templates'),
        layout: 'layout',
        // Development reads the files for every mail, so edits show up without a restart
        cache: process.env.NODE_ENV === 'production',
      }),
      from: 'Orders <orders@example.com>',
    }),
    OrdersModule,
    NotificationsModule,
  ],
})
export class AppModule {}
```

- `transport`: how mail leaves the application. Every transport extends the abstract `MailTransport` class, which is also its injection token, so tests replace it with `overrideProvider(MailTransport)`. `FileMailTransport` is for development: open the `.eml` files in any mail client to see exactly what would be sent. It writes to the local disk and reaches nobody, so [in production](/application/mail#send-in-production) the application switches to SMTP or Resend.
- `templates`: renders the mails that name a template. `FileTemplateEngine` reads `.html` files from `dir`, and wraps every mail in the `layout` template, `mail/templates/layout.html`. A relative `dir` is resolved against the working directory; built from `import.meta.dirname`, it points next to the compiled `app.module.js`, wherever the application is started. Compiled templates are cached. With `cache` off, as here outside production, every mail reads the files again, so an edited template shows up in the next mail without a restart.
- `from`: the default sender. A message can override it.

The TypeScript compiler doesn't copy HTML files to `dist`. Add the templates to the [assets](/cli/monorepo#assets) in `nest-cli.json`, so they land in `dist/mail/templates`, next to the compiled `app.module.js`:

```json
{
  "compilerOptions": {
    "assets": ["mail/templates/**/*"],
    "watchAssets": true
  }
}
```

With `watchAssets`, `nest start --watch` copies a template to `dist` whenever you save it.

> info **Hint** The tutorial reads `process.env` directly, to stay short. In an application, load the environment through [`@nestjs/config`](/application/configuration) with a validation schema, so a missing `DATABASE_URL` or `SMTP_URL` stops the application at startup, and read the values from `ConfigService` in the factories.

`MailModule` is global and provides `Mailer`, which sends mail, and `MailEvents`, which reports what was sent and what failed. A missing `transport` or an invalid `from` stops the application at startup, with a message that names the option.

#### Write the order confirmation mail

The mail's body is an HTML template. Values go between double braces, and a block such as `#each` repeats its part of the template for every item of a list:

```html
@@filename(mail/templates/order-confirmation.html)
<p>Hi {{ '{' }}{{ '{' }} customer.name {{ '}' }}{{ '}' }},</p>
<p>thank you for your order! We are packing it now.</p>
<table>
  <tr><th>Product</th><th>Qty</th><th>Price</th></tr>
  {{ '{' }}{{ '{' }}#each items{{ '}' }}{{ '}' }}
  <tr>
    <td>{{ '{' }}{{ '{' }} name {{ '}' }}{{ '}' }}</td>
    <td>{{ '{' }}{{ '{' }} quantity {{ '}' }}{{ '}' }}</td>
    <td>{{ '{' }}{{ '{' }} price {{ '}' }}{{ '}' }}</td>
  </tr>
  {{ '{' }}{{ '{' }}/each{{ '}' }}{{ '}' }}
</table>
<p><strong>Total: {{ '{' }}{{ '{' }} total {{ '}' }}{{ '}' }}</strong></p>
<p><a href="{{ '{' }}{{ '{' }} orderUrl {{ '}' }}{{ '}' }}">View your order</a></p>
```

Every mail is wrapped in the layout. It places the rendered mail with triple braces around `body`, and includes the signature, a partial that lives in `mail/templates/partials/signature.html`:

```html
@@filename(mail/templates/layout.html)
<!DOCTYPE html>
<html>
<body>
{{ '{' }}{{ '{' }}{{ '{' }} body {{ '}' }}{{ '}' }}{{ '}' }}
{{ '{' }}{{ '{' }}> signature{{ '}' }}{{ '}' }}
</body>
</html>
```

```html
@@filename(mail/templates/partials/signature.html)
<p>The customer care team</p>
```

A mail class implements `Mailable<TData>`. Its `render()` method gets the data and returns the subject, the template's name and its context, the values the template reads:

```typescript
@@filename(notifications/order-confirmation.mail)
import { Injectable } from '@nestjs/common';
import type { Mailable } from '@nestjs/mail';
import type { Customer } from '../customers/customers.repository.js';
import type { Order } from '../orders/order.js';

export interface OrderConfirmation {
  order: Order;
  customer: Customer;
}

const SHOP_URL = process.env.SHOP_URL ?? 'https://shop.example.com';

@Injectable()
export class OrderConfirmationMail implements Mailable<OrderConfirmation> {
  render({ order, customer }: OrderConfirmation) {
    const price = (cents: number) => `$${(cents / 100).toFixed(2)}`;
    return {
      subject: `Your order #${order.number}`,
      // mail/templates/order-confirmation.html, wrapped in the layout
      template: 'order-confirmation',
      // The values the template shows, ready to insert: prices formatted, the link built
      context: {
        customer,
        items: order.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: price(item.price * item.quantity),
        })),
        total: price(order.total),
        orderUrl: `${SHOP_URL}/orders/${order.id}`,
      },
    };
  }
}
```

The template is logic-less. It has values, `#if`, `#unless` and `#each` blocks, partials and comments, but no helpers and no expressions: what needs code, such as formatting a price or building a link, happens in the mail class, in TypeScript, where it's typed and tested. The syntax is a subset of Handlebars (see [Template syntax](/application/mail#template-syntax)), so the templates move to [another engine](/application/mail#use-another-template-engine) as they are.

Double braces escape the value. A product named `Feather wand toy <limited edition>` becomes `Feather wand toy &lt;limited edition&gt;`, and the customer's name can't inject markup. Two rules make it hard to get wrong:

- Escaping protects element content and quoted attribute values, so those are the only places a double-braced value may go. A value inside a tag anywhere else is a compile error: `href=` followed directly by the value, or a value standing between attributes. Escaping can't protect either place (unquoted, a space in the value would start a new attribute). Quote attribute values, as the link above does.
- Triple braces insert a value as it is, for HTML you produced yourself. In this tutorial, only the layout's `body` needs them.

A missing value renders as nothing, as in Handlebars. Inside `#each`, `this` is the item, `@index`, `@first` and `@last` describe its position, and a name the item doesn't have is looked up in the template's context, so a row can show a value from outside the list. A template that doesn't compile fails the mail with a permanent `MailTemplateError`, which names the file and the position:

```text
order-confirmation.html:5:3: {{ '{' }}{{ '{' }}#each items{{ '}' }}{{ '}' }} is never closed (expected {{ '{' }}{{ '{' }}/each{{ '}' }}{{ '}' }})
```

There is no text template. The mailer derives the plain-text part from the HTML: paragraphs, table rows, and links as `View your order (https://shop.example.com/orders/…)`. Mail clients that don't show HTML, and spam filters, read that part. To write it yourself, add `order-confirmation.txt` next to the HTML: the engine renders it as the text part, with the same syntax, without escaping.

Register the class as a provider, like any other injectable:

```typescript
@@filename(notifications/notifications.module)
import { Module } from '@nestjs/common';
import { OrderConfirmationMail } from './order-confirmation.mail.js';

@Module({
  providers: [OrderConfirmationMail],
})
export class NotificationsModule {}
```

Then send it when an order is placed. `mailer.send()` takes the mail class and the recipient, and the type of `data` comes from the class's `render()`:

```typescript
@@filename(orders/orders.service)
async placeOrder({ customerId, items }: PlaceOrderDto): Promise<Order> {
  const customer = await this.customersRepository.findById(customerId);
  if (!customer) {
    throw new BadRequestException(`Unknown customer "${customerId}"`);
  }
  if (!items?.length) {
    throw new BadRequestException('An order needs at least one item');
  }

  const order = await this.db.transaction((tx) => this.insertOrder(tx, customerId, items));

  // After the commit: never inside the transaction, which would stay open, holding its
  // connection and locks, for as long as the mail server takes to answer
  await this.mailer.send(OrderConfirmationMail, {
    to: { name: customer.name, address: customer.email },
    data: { order, customer },
  });
  return order;
}
```

The recipient is an object with a `name` and an `address`, so a name with a comma or quotes stays one display name. A string works too, as in `'Ada Lovelace <ada@example.com>'`, but a string must hold exactly one address: a comma-separated list throws, so a name typed by a user can never add a recipient. Lists of recipients are arrays.

Place an order and a file appears in `var/mail`. This works, but it sends the mail from the request, after the commit. [Send after the order commits](/application/mail#send-after-the-order-commits) explains why that isn't good enough, and fixes it.

**Mails written inline.** A mail small enough to write in TypeScript doesn't need a template file. `render()` returns `html` in place of `template` and `context`, built with the `html` tagged template:

```typescript
@@filename(notifications/order-confirmation.mail)
return {
  subject: `Your order #${order.number}`,
  html: html`
    <p>Hi ${customer.name},</p>
    <p>thank you for your order! We are packing it now.</p>
    <table>
      ${order.items.map(
        (item) => html`
          <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${price(item.price * item.quantity)}</td>
          </tr>`,
      )}
    </table>
    // ...
};
```

`html` escapes every value you interpolate, by the same rules as a template: a value inside a tag must be in a quoted attribute value, or it throws. Nested `html` templates and arrays of them, like the table rows, are inserted as they are, and `unsafeHtml()` inserts HTML you produced yourself; the name is the warning. `mailer.send()` takes `html` too, for a message sent without a mail class.

#### Attach the invoice and preview the mail

The invoice is a PDF, rendered by a small provider. It writes the PDF by hand with a built-in font, to keep the example free of dependencies. A real application uses a PDF library or a rendering service here. The mail only needs the bytes:

```typescript
@@filename(notifications/invoice-pdf)
@Injectable()
export class InvoicePdf {
  render(order: Order, customer: Customer): Buffer {
    const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
    const lines = [
      `Invoice ${order.number}`,
      `Date: ${order.placedAt.slice(0, 10)}`,
      `Bill to: ${customer.name}`,
      '',
      ...order.items.map((item) => `${item.quantity} x ${item.name}  ${money(item.price * item.quantity)}`),
      '',
      `Total: ${money(order.total)}`,
    ];
    // ...
  }
}
```

`render()` returns attachments along with the template. The invoice is a regular attachment. The logo is an inline image: its `cid` makes it part of the HTML, which references it as `cid:logo@example.com`. The logo heads every mail, so the reference goes in the layout:

```html
@@filename(mail/templates/layout.html)
<!DOCTYPE html>
<html>
<body>
<p><img src="cid:logo@example.com" alt="Logo" width="120" height="32"></p>
{{ '{' }}{{ '{' }}{{ '{' }} body {{ '}' }}{{ '}' }}{{ '}' }}
{{ '{' }}{{ '{' }}> signature{{ '}' }}{{ '}' }}
</body>
</html>
```

The mail class attaches the logo and the invoice:

```typescript
@@filename(notifications/order-confirmation.mail)
const LOGO = join(import.meta.dirname, 'assets/logo.png');

@Injectable()
export class OrderConfirmationMail implements Mailable<OrderConfirmation> {
  constructor(private readonly invoicePdf: InvoicePdf) {}

  render({ order, customer }: OrderConfirmation) {
    // ...
    return {
      subject: `Your order #${order.number}`,
      // mail/templates/order-confirmation.html, wrapped in the layout
      template: 'order-confirmation',
      // ...
      attachments: [
        // Inline: the layout's <img> references it by its cid
        { cid: 'logo@example.com', path: LOGO },
        { filename: `invoice-${order.number}.pdf`, content: this.invoicePdf.render(order, customer) },
      ],
    };
  }
}
```

Every mail rendered in this layout attaches the logo the same way, or its header shows a broken image. The template gets one more line after the link, `<p>Your invoice is attached.</p>`.

An attachment's content is a `Buffer`, a string, or a stream, or it's read from a local `path` when the mail is sent. The content type comes from the file name, and a non-ASCII file name is encoded so that every mail client shows it. The mailer arranges the parts the way mail clients expect: the logo sits next to the HTML, so a client that shows the text version doesn't list it as an attachment.

> warning **Warning** Never build an attachment `path` from user input. The file at that path is attached, whatever it is. URLs are refused, not fetched.

While you work on the template, you don't want to place an order for every change. `mailer.render()` renders a mail class without sending it. A development-only route shows the result in the browser. With the template cache off, it shows an edited template on the next refresh:

```typescript
@@filename(notifications/mail-preview.controller)
import { Controller, Get, Header } from '@nestjs/common';
import { Mailer } from '@nestjs/mail';
import { OrderConfirmationMail, type OrderConfirmation } from './order-confirmation.mail.js';

const SAMPLE: OrderConfirmation = {
  customer: {
    id: 'sample',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    // ...
  },
  order: {
    id: '00000000-0000-4000-8000-000000000000',
    number: 1001,
    customerId: 'sample',
    items: [
      { productId: 'salmon-kibble-2kg', name: 'Salmon kibble, 2 kg', quantity: 2, price: 2499 },
      { productId: 'feather-wand', name: 'Feather wand toy', quantity: 1, price: 799 },
    ],
    total: 5797,
    placedAt: '2026-09-22T10:00:00.000Z',
  },
};

@Controller('dev/mail')
export class MailPreviewController {
  constructor(private readonly mailer: Mailer) {}

  /** Renders the mail with sample data, without sending it: GET /dev/mail/order-confirmation */
  @Get('order-confirmation')
  @Header('content-type', 'text/html; charset=utf-8')
  async orderConfirmation() {
    const message = await this.mailer.render(OrderConfirmationMail, { data: SAMPLE });

    // Browsers don't resolve cid: references; inline the images as data: URLs instead
    let body = message.html ?? '';
    for (const { cid, contentType, content } of message.attachments) {
      if (cid) {
        body = body.replaceAll(`cid:${cid}`, `data:${contentType};base64,${content.toString('base64')}`);
      }
    }
    return body;
  }
}
```

`render()` returns the finished `MailMessage`: the subject, the HTML and the derived text, the attachments, and `toMime()` for the raw message. Recipients are optional here. `render()` also takes a message written inline, such as a subject, a `template` and its `context`, to preview a template without a mail class. Register the controller only outside production:

```typescript
@@filename(notifications/notifications.module)
@Module({
  // The preview route renders mail with sample data; production doesn't need it
  controllers: process.env.NODE_ENV === 'production' ? [] : [MailPreviewController],
  providers: [OrderConfirmationMail, InvoicePdf],
})
export class NotificationsModule {}
```

#### Send after the order commits

[Write the order confirmation mail](/application/mail#write-the-order-confirmation-mail) sends the mail from the request, after the order commits. Three things go wrong there:

- **A crash between the commit and the send loses the mail.** A deploy that restarts the process at the wrong moment leaves a paid order without a confirmation.
- **A mail server outage fails a request that already succeeded.** The order is saved, but the customer sees a 500 and may order again.
- **The customer waits for the mail server.** An SMTP exchange takes hundreds of milliseconds, and a slow server takes the request's time with it.

This is the dual-write problem from the [outbox tutorial](/reliability/outbox), and the outbox (`@nestjs/outbox`, installed and set up in that tutorial) fixes it. The order and an `order.placed` message commit in one transaction, and a relay hands the message to a handler that sends the mail. If the send fails, the relay retries it with backoff, and it moves messages that never succeed to the dead-letter table. The outbox keeps its messages in the application's PostgreSQL database, next to the orders, through its store, `PostgresOutboxStore` from `@nestjs/outbox/postgres`, on the database that [`@nestjs/drizzle`](/data/drizzle) registers. The store creates its tables, in a schema of their own, when the application starts; [Keep messages in your database](/reliability/outbox#keep-messages-in-your-database) in the outbox tutorial covers them, and how to apply their migrations in production.

This section shows the order transaction twice: first with Drizzle, which is the tutorial's path, and then, under "With TypeORM" at the end of the section, the same transaction for an application whose ORM is TypeORM. Take one of the two.

Register `OutboxModule`, and the store as a provider of the root module: a factory that injects the Drizzle database and the `OutboxStorage` registry, which the store registers itself with. Without it, the outbox would keep its messages in memory, and lose them on restart:

```typescript
@@filename(app.module)
@Module({
  imports: [
    // ...
    OutboxModule.forRootAsync({
      useFactory: () => ({
        relay: { enabled: process.env.OUTBOX_RELAY !== 'off' },
        // A mail server that is down for a while doesn't lose the confirmation
        retry: { attempts: 10, backoff: { delay: '10s', maxDelay: '10m' } },
      }),
    }),
    // ...
  ],
  providers: [
    {
      // Messages and inbox records in your database, in a schema of their own (nest_outbox)
      provide: PostgresOutboxStore,
      inject: [getDrizzleToken(), OutboxStorage],
      useFactory: (db: Database, outboxStorage: OutboxStorage) =>
        new PostgresOutboxStore({ executor: fromDrizzle(db) }, outboxStorage),
    },
  ],
})
export class AppModule {}
```

`OrdersService` adds the message instead of sending the mail, with Drizzle's `tx`, so the message commits or rolls back with the order:

```typescript
@@filename(orders/orders.service)
async placeOrder({ customerId, items }: PlaceOrderDto): Promise<Order> {
  if (!(await this.customersRepository.findById(customerId))) {
    throw new BadRequestException(`Unknown customer "${customerId}"`);
  }
  if (!items?.length) {
    throw new BadRequestException('An order needs at least one item');
  }

  const order = await this.db.transaction(async (tx) => {
    const order = await this.insertOrder(tx, customerId, items);
    // Same transaction: the confirmation mail is queued only if the order commits
    await this.outbox.add(tx, { topic: 'order.placed', payload: order });
    return order;
  });

  this.outbox.notify(); // send now instead of at the next poll
  return order;
}
```

The handler sends the mail:

```typescript
@@filename(notifications/order-mails.handler)
import { Injectable } from '@nestjs/common';
import { MailError, Mailer } from '@nestjs/mail';
import { NonRetryableMessageError, OnOutboxMessage, type OutboxHandlerContext } from '@nestjs/outbox';
import { CustomersRepository } from '../customers/customers.repository.js';
import type { Order } from '../orders/order.js';
import { OrderConfirmationMail } from './order-confirmation.mail.js';

@Injectable()
export class OrderMailsHandler {
  constructor(
    private readonly mailer: Mailer,
    private readonly customersRepository: CustomersRepository,
  ) {}

  // Runs after the order committed. The inbox skips messages this consumer already handled.
  @OnOutboxMessage('order.placed', { consumer: 'order-confirmation-mail' })
  async sendConfirmation(order: Order, { message, signal }: OutboxHandlerContext) {
    const customer = await this.customersRepository.findById(order.customerId);
    if (!customer) {
      throw new NonRetryableMessageError(`Customer ${order.customerId} not found`);
    }

    try {
      await this.mailer.send(OrderConfirmationMail, {
        to: { name: customer.name, address: customer.email },
        data: { order, customer },
        // Over SMTP, a redelivery of this message keeps its Message-ID; Resend gets the
        // key as its Idempotency-Key and refuses the duplicate
        idempotencyKey: message.id,
        signal,
        // The outbox retries with its own backoff, and dead-letters what never succeeds
        retry: false,
      });
    } catch (error) {
      // A refused address or sender won't be accepted later: dead-letter it now
      if (error instanceof MailError && error.permanent) {
        throw new NonRetryableMessageError(error.message, { cause: error });
      }
      throw error;
    }
  }
}
```

Register the handler in `NotificationsModule`, which imports `CustomersModule` for the repository:

```typescript
@@filename(notifications/notifications.module)
@Module({
  imports: [CustomersModule],
  // The preview route renders mail with sample data; production doesn't need it
  controllers: process.env.NODE_ENV === 'production' ? [] : [MailPreviewController],
  providers: [OrderConfirmationMail, InvoicePdf, OrderMailsHandler],
})
export class NotificationsModule {}
```

Each option of the `send()` call has a job:

- **`idempotencyKey`.** The outbox delivers at least once: a relay that crashes after sending, before recording it, sends again. The key identifies the mail across those deliveries. The `Message-ID` header is derived from it, so over SMTP a duplicate carries the same id, which Gmail and other receivers use to drop it. `ResendTransport` sends the key as Resend's `Idempotency-Key`, and Resend refuses the duplicate for 24 hours. Postmark, SendGrid and SES assign their own `Message-ID` and have no idempotency keys, so with them a redelivery can reach the customer twice.
- **`signal`.** The relay aborts it when the handler outlives `publishTimeout`. The mailer stops the SMTP exchange or the HTTP request.
- **`retry: false`.** The mailer retries transient failures three times by default, with backoff. Here the outbox already retries, over minutes instead of seconds, so the mailer makes one attempt per delivery. Retries at both layers would multiply.

Every error the package throws extends `MailError`, and its `permanent` flag says whether sending the same message again can succeed. A 4xx SMTP reply (greylisting, a full mailbox), a 429 from an HTTP provider, a timeout or a dropped connection is transient: the handler rethrows it, and the outbox retries. A 5xx reply, such as `550 5.1.1 User unknown`, is permanent: the handler throws `NonRetryableMessageError`, and the outbox dead-letters the message at once instead of trying ten more times.

When SMTP refuses one of several recipients, the transaction is reset before the message is sent, so an error always means nobody received it, and the outbox's retry can't deliver twice. The one exception: the connection drops after the message was transmitted, before the server answers. The mailer can't know whether the server kept it, reports a transient error, and the retry sends it again, with the same `Message-ID`.

**With TypeORM.** The same order transaction for an application whose ORM is TypeORM. Drizzle stays the tutorial's path: take this code instead of the Drizzle code above, not next to it. The outbox keeps its messages through the same store, on TypeORM's data source, as the outbox tutorial's [Keep messages in your database](/reliability/outbox#keep-messages-in-your-database) shows. The example application keeps this version in `src/typeorm`, next to the tutorial's Drizzle code, with the customers, products and orders as entities.

`TypeOrmModule` takes the place of `DrizzleModule` in the root module, with the options the TypeORM CLI shares, and the store's factory injects its `DataSource`, through `fromTypeOrm()`:

```typescript
@@filename(typeorm/app.module)
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      // The entities and migrations the CLI uses; migrations run on deploy (`migration:run`)
      useFactory: () => ({ ...dataSourceOptions, url: process.env.DATABASE_URL }),
    }),
    // ...
    OutboxModule.forRootAsync({
      useFactory: () => ({
        relay: { enabled: process.env.OUTBOX_RELAY !== 'off' },
        // A mail server that is down for a while doesn't lose the confirmation
        retry: { attempts: 10, backoff: { delay: '10s', maxDelay: '10m' } },
      }),
    }),
    // ...
  ],
  providers: [
    {
      // Messages and inbox records in your database, in a schema of their own (nest_outbox)
      provide: PostgresOutboxStore,
      inject: [DataSource, OutboxStorage],
      useFactory: (dataSource: DataSource, outboxStorage: OutboxStorage) =>
        new PostgresOutboxStore({ executor: fromTypeOrm(dataSource) }, outboxStorage),
    },
  ],
})
export class AppModule {}
```

`OrdersService` opens its transaction with the data source, and passes the transaction's entity manager to `outbox.add()`, next to its own writes. The outbox's type parameter is TypeORM's `EntityManager`:

```typescript
@@filename(typeorm/orders.service)
@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly customersRepository: CustomersRepository,
    private readonly outbox: Outbox<EntityManager>,
  ) {}

  async placeOrder({ customerId, items }: PlaceOrderDto): Promise<Order> {
    // ... check the customer and the items, as in the Drizzle version

    const order = await this.dataSource.transaction(async (manager) => {
      const order = await this.insertOrder(manager, customerId, items);
      // The transaction's EntityManager: the confirmation mail is queued only if the order commits
      await this.outbox.add(manager, { topic: 'order.placed', payload: order });
      return order;
    });

    this.outbox.notify(); // send now instead of at the next poll
    return order;
  }

  private async insertOrder(manager: EntityManager, customerId: string, items: PlaceOrderDto['items']): Promise<Order> {
    const found = await manager.findBy(ProductEntity, { id: In(items.map((item) => item.productId)) });
    // ... price the lines and total them, as in the Drizzle version
    // The database numbers the order from its sequence: 1001, 1002, ...
    const { generatedMaps } = await manager.insert(OrderEntity, { id, customerId, items: lines, total, placedAt });
    const { number } = generatedMaps[0] as Pick<OrderEntity, 'number'>;
    return { id, number, customerId, items: lines, total, placedAt: placedAt.toISOString() };
  }
}
```

`OrderEntity` declares `number` as an identity column (`generated: 'identity'`), so `manager.insert()` returns the number the database assigned in `generatedMaps`. An entity can't state where the sequence starts, so the example's seed migration restarts it at 1001, next to the customers and products it inserts. The handler and `NotificationsModule` stay as they are; `CustomersRepository` reads the customer with TypeORM, like the rest of the application.

#### Send in production

Development writes files, to a local disk that a container loses when it's replaced; production needs a real transport. Pick it from the environment, so the same build runs everywhere:

```typescript
@@filename(mail-transport)
import { FileMailTransport, ResendTransport, SmtpTransport, type MailTransport } from '@nestjs/mail';
import { readFileSync } from 'node:fs';

/**
 * The transport for this environment: `file` in development (the default), `smtp` or
 * `resend` in production. Missing settings fail at startup, naming the variable.
 */
export function mailTransport(env: NodeJS.ProcessEnv = process.env): MailTransport {
  switch (env.MAIL_TRANSPORT ?? 'file') {
    case 'file':
      return new FileMailTransport({ directory: env.MAIL_DIRECTORY ?? 'var/mail' });
    case 'smtp':
      return new SmtpTransport({
        url: required(env, 'SMTP_URL'), // smtp://user:password@smtp.example.com:587
        pool: true,
        // A private CA, e.g. for a relay inside the company network
        ...(env.SMTP_CA_FILE && { tls: { ca: readFileSync(env.SMTP_CA_FILE) } }),
      });
    case 'resend':
      return new ResendTransport({ apiKey: required(env, 'RESEND_API_KEY') });
    default:
      throw new Error(`MAIL_TRANSPORT must be "file", "smtp" or "resend" (got "${env.MAIL_TRANSPORT}")`);
  }
}

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name];
  if (!value) {
    throw new Error(`${name} is required when MAIL_TRANSPORT is "${env.MAIL_TRANSPORT}"`);
  }
  return value;
}
```

Build the transport in `forRootAsync()`. The factory runs at startup, so a typo in `MAIL_TRANSPORT` or a missing `SMTP_URL` stops the application there instead of failing the first mail:

```typescript
@@filename(app.module)
MailModule.forRootAsync({
  // Runs at startup: a bad MAIL_TRANSPORT or a missing SMTP_URL stops the app there
  useFactory: () => ({
    transport: mailTransport(),
    templates: new FileTemplateEngine({
      dir: join(import.meta.dirname, 'mail/templates'),
      layout: 'layout',
      cache: process.env.NODE_ENV === 'production',
    }),
    from: process.env.MAIL_FROM ?? 'Orders <orders@example.com>',
  }),
}),
```

**SMTP.** `SmtpTransport` speaks SMTP itself, on `node:net` and `node:tls`:

- **Encryption.** On port 587 it upgrades with STARTTLS, and a server that doesn't offer STARTTLS is refused rather than sent to in plaintext. `startTls: 'opportunistic'`, the default for localhost, upgrades only when the server offers it, and `'never'` stays in plaintext, for a relay on a trusted network. On port 465 (`smtps://`) it uses TLS from the first byte. Certificates are verified against the host name; `tls.ca` adds a private CA. Credentials are never sent over an unencrypted connection, except to localhost.
- **Authentication.** It uses AUTH PLAIN or LOGIN, whichever the server offers, and `authMethod` forces one. For Gmail and Microsoft 365, pass an OAuth access token as `accessToken` in `auth` for XOAUTH2. OAuth access tokens expire, typically after an hour, so `accessToken` can also be a function that returns one, or a promise of one: it's called for every new connection, and can fetch a fresh token. `name` sets the name the transport introduces itself with in `EHLO`; the default is the machine's host name when it's fully qualified, else its IP address.
- **Pooling.** `pool: true` keeps up to five connections open and reuses them, instead of a TCP and TLS handshake per mail. An object sets the limits: `maxConnections` (default 5; further sends wait for a free connection), `maxMessages` (default 100, after which a connection is replaced) and `idleTimeout` (default `'30s'`, after which an idle connection is closed). Every connection says `QUIT` when the application shuts down.
- **Replies.** A 4xx reply is a transient `MailSmtpError`, a 5xx reply a permanent one. Both carry the reply `code`, the enhanced code (such as `5.1.1`) and the server's text.

To sign mail with DKIM when your SMTP server doesn't, add `dkim` with the domain (`domainName`), the selector (`keySelector`) and the private key (`privateKey`, PEM or a `KeyObject`). An RSA key signs with `rsa-sha256`, an Ed25519 key with `ed25519-sha256` (RFC 8463); not every receiver verifies Ed25519 signatures yet, and the transport signs with one key, so RSA is the safe choice unless you know your recipients' servers do. The signature covers From, Reply-To, To, Cc, Subject, Date, Message-ID and the MIME headers, plus the message's custom headers; `dkim.headers` replaces that list. From is always signed, and listed once more than it occurs in the message, so a second From added below the signature breaks it. HTTP providers sign with your verified domain themselves.

**HTTP providers.** `ResendTransport`, `PostmarkTransport`, `SendGridTransport` and `SesTransport` call the providers' APIs with `fetch`, and need no SDK. The `fetch` option replaces the global one, to go through a proxy or to stub the API in a test. `SesTransport` signs its requests with AWS Signature Version 4, and accepts the AWS SDK's credential providers, such as instance roles, as `credentials`. Of the four, only Resend supports idempotency keys. Resend and SendGrid need at least one `to` recipient: a mail with only `cc` or `bcc` fails with `MailMessageError` before the request.

**Internationalized addresses.** A domain with non-ASCII characters (`zoë@kočka.example`) is converted to its ASCII form (IDNA, `xn--...`) for every transport, so no server has to support it. A non-ASCII local part, before the `@`, can't be converted: over SMTP it needs the server's SMTPUTF8 extension. `SmtpTransport` uses SMTPUTF8 when the server offers it, and otherwise fails with a permanent `MailConnectionError` before sending anything: `The SMTP server ... doesn't support SMTPUTF8, which an address with non-ASCII characters needs`. The HTTP providers get the address as it is, and whether they accept it is up to the provider.

Use `app.enableShutdownHooks()` in `main.ts`, so a deploy lets the relay finish the mails it is sending, and closes the SMTP pool afterwards.

#### Send it in the customer's language

The store sells in English and Polish. Customers choose a language when they sign up, and the `customers` table stores it in a `locale` column: `en` or `pl`. The mailer hands the locale of each send to the template engine, which picks the template for it.

Translate the template: add `order-confirmation.pl.html` next to the English one.

```html
@@filename(mail/templates/order-confirmation.pl.html)
<p>Cześć {{ '{' }}{{ '{' }} customer.name {{ '}' }}{{ '}' }},</p>
<p>dziękujemy za zamówienie! Właśnie je pakujemy.</p>
<table>
  <tr><th>Produkt</th><th>Ilość</th><th>Cena</th></tr>
  {{ '{' }}{{ '{' }}#each items{{ '}' }}{{ '}' }}
  <tr>
    <td>{{ '{' }}{{ '{' }} name {{ '}' }}{{ '}' }}</td>
    <td>{{ '{' }}{{ '{' }} quantity {{ '}' }}{{ '}' }}</td>
    <td>{{ '{' }}{{ '{' }} price {{ '}' }}{{ '}' }}</td>
  </tr>
  {{ '{' }}{{ '{' }}/each{{ '}' }}{{ '}' }}
</table>
<p><strong>Razem: {{ '{' }}{{ '{' }} total {{ '}' }}{{ '}' }}</strong></p>
<p><a href="{{ '{' }}{{ '{' }} orderUrl {{ '}' }}{{ '}' }}">Zobacz zamówienie</a></p>
<p>Fakturę znajdziesz w załączniku.</p>
```

For the locale `pl`, `FileTemplateEngine` renders `order-confirmation.pl.html`, and for any other locale, or none, `order-confirmation.html`. A regional locale tries itself first, then its language: for `pt-BR`, the engine looks for `order-confirmation.pt-BR.html`, then `order-confirmation.pt.html`. Partials and the layout are looked up the same way, so the layout stays shared, and the Polish signature is a partial of its own:

```html
@@filename(mail/templates/partials/signature.pl.html)
<p>Zespół obsługi klienta</p>
```

A mail's copy is prose, so it's translated a file at a time: the translator sees the whole mail, and writes Polish sentences instead of filling in keys one by one. What the mail class computes still depends on the locale: the subject, the invoice's file name and the prices. They come from `@nestjs/i18n`, which the [internationalization chapter](/application/i18n) covers in depth. Add a catalog for the mail, one per language:

```json
@@filename(i18n/en/mail.json)
{
  "orderConfirmation": {
    "subject": "Your order #{number}",
    "invoiceFile": "invoice-{number}.pdf"
  }
}
```

```json
@@filename(i18n/pl/mail.json)
{
  "orderConfirmation": {
    "subject": "Twoje zamówienie #{number}",
    "invoiceFile": "faktura-{number}.pdf"
  }
}
```

Register the catalogs' shape, so keys are checked at compile time, and register `I18nModule` next to `MailModule`:

```typescript
@@filename(i18n/translations)
import type mail from './en/mail.json';

export interface Translations {
  mail: typeof mail;
}

declare module '@nestjs/i18n' {
  interface I18nTypes {
    translations: Translations;
  }
}
```

```typescript
@@filename(app.module)
@Module({
  imports: [
    // ...
    I18nModule.forRoot({
      defaultLocale: 'en',
      supportedLocales: ['en', 'pl'],
      loader: new JsonI18nLoader({ path: join(import.meta.dirname, 'i18n') }),
    }),
    MailModule.forRootAsync({
      // ...
    }),
    // ...
  ],
})
export class AppModule {}
```

Add the catalogs to the assets in `nest-cli.json` too (`i18n/**/*.json`), as the internationalization chapter shows.

The mail class is a provider, so it injects `I18nService` next to the invoice renderer. `render()` gets a second argument, the render context, whose `locale` is the one passed to `send()`, and the one the mailer hands to the template engine. Its `to` holds the parsed recipients, and is empty for a preview rendered without them:

```typescript
@@filename(notifications/order-confirmation.mail)
type Key = keyof Translations['mail']['orderConfirmation'];

const SHOP_URL = process.env.SHOP_URL ?? 'https://shop.example.com';
const LOGO = join(import.meta.dirname, 'assets/logo.png');

@Injectable()
export class OrderConfirmationMail implements Mailable<OrderConfirmation> {
  constructor(
    private readonly i18nService: I18nService,
    private readonly invoicePdf: InvoicePdf,
  ) {}

  render({ order, customer }: OrderConfirmation, { locale }: MailRenderContext) {
    // Mail is sent outside the customer's request, so the locale is always passed explicitly
    const t = (key: Key, args?: Record<string, unknown>) =>
      this.i18nService.t(`mail.orderConfirmation.${key}`, { locale, args });
    const price = (cents: number) =>
      this.i18nService.formatNumber(cents / 100, { locale, style: 'currency', currency: 'USD' });
    return {
      subject: t('subject', { number: order.number }),
      // order-confirmation.pl.html for Polish, else order-confirmation.html
      template: 'order-confirmation',
      // ...
      attachments: [
        // Inline: the layout's <img> references it by its cid
        { cid: 'logo@example.com', path: LOGO },
        { filename: t('invoiceFile', { number: order.number }), content: this.invoicePdf.render(order, customer) },
      ],
    };
  }
}
```

The context doesn't change: the same values fill either template. `Key` is `keyof Translations['mail']['orderConfirmation']`, so a misspelled key is a compile error. Prices are formatted for the locale: `$25.98` in English, `25,98 USD` in Polish. The invoice's file name comes from the catalog: `invoice-1001.pdf` or `faktura-1001.pdf`.

> warning **Warning** Pass the locale explicitly. `I18nService` falls back to the current request's locale, and mail is often sent outside the recipient's request: from an outbox handler, as here, or from a request made by someone else, such as an admin. That request's locale is the wrong one.

The outbox handler passes the customer's locale when sending:

```typescript
@@filename(notifications/order-mails.handler)
await this.mailer.send(OrderConfirmationMail, {
  to: { name: customer.name, address: customer.email },
  data: { order, customer },
  locale: customer.locale,
  // ...
});
```

A Polish subject or recipient name can't go into a mail header as it is: headers are ASCII. The mailer encodes non-ASCII header text as RFC 2047 encoded-words, such as `=?UTF-8?Q?Twoje_zam=C3=B3wienie_=231001?=`, and the body as quoted-printable, so every server carries the message unchanged and mail clients show `Twoje zamówienie #1001`.

The preview takes the language from the query string, so both versions can be checked in a browser:

```typescript
@@filename(notifications/mail-preview.controller)
/** Renders the mail with sample data, without sending it: GET /dev/mail/order-confirmation?locale=pl */
@Get('order-confirmation')
@Header('content-type', 'text/html; charset=utf-8')
async orderConfirmation(@Query('locale') locale = 'en') {
  const message = await this.mailer.render(OrderConfirmationMail, { data: SAMPLE, locale });
  // ...
}
```

#### Use another template engine

`FileTemplateEngine` implements `MailTemplateEngine`, an abstract class with one method: `render()` takes the template's name, the context and the locale, and returns the HTML, or an object with `html` and `text`, or a promise of either. Extend it to render with Handlebars, EJS or anything else. An engine for Handlebars templates in `.hbs` files:

```typescript
@@filename(mail/handlebars-template.engine)
import { MailTemplateEngine, MailTemplateError, type MailTemplateRenderOptions } from '@nestjs/mail';
import Handlebars from 'handlebars';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const TEMPLATES = join(import.meta.dirname, 'templates');

/** Renders order-confirmation.pl.hbs, else order-confirmation.hbs, with Handlebars. */
export class HandlebarsTemplateEngine extends MailTemplateEngine {
  private readonly templates = new Map<string, ReturnType<typeof Handlebars.compile> | undefined>();

  async render(name: string, context: object, { locale }: MailTemplateRenderOptions) {
    // Only a language code goes into a file name, never whatever the locale holds
    const localized = locale && /^[a-z]{2}$/.test(locale) ? [`${name}.${locale}.hbs`] : [];
    for (const file of [...localized, `${name}.hbs`]) {
      const template = await this.load(file);
      if (template) {
        return template(context);
      }
    }
    throw new MailTemplateError(`No template "${name}" in ${TEMPLATES}`, { template: name });
  }

  private async load(file: string) {
    if (!this.templates.has(file)) {
      const source = await readFile(join(TEMPLATES, file), 'utf8').catch(() => undefined);
      // compat: plain paths fall back to outer contexts, as in FileTemplateEngine
      this.templates.set(file, source === undefined ? undefined : Handlebars.compile(source, { compat: true }));
    }
    return this.templates.get(file);
  }
}
```

Pass it as `templates` in place of `FileTemplateEngine`: an instance, or the class, which Nest instantiates, so it can inject configuration or other providers. As with the transport, a class goes at the top level of `forRootAsync()`, next to `useFactory`, and the factory returns instances.

The mailer sends the HTML as the engine returns it, so escaping is the engine's job: Handlebars escapes double-braced values, as `FileTemplateEngine` does. `compat: true` makes names inside `#each` fall back to the outer context, so the templates of this tutorial render under Handlebars as they are. Handlebars doesn't know about the `partials/` folder and the layout: register the partials with `Handlebars.registerPartial()`, and render the layout around the mail yourself. For [MJML](https://mjml.io), convert the rendered MJML with `mjml2html()` before returning the HTML. Throw `MailTemplateError` for a template that is missing or broken: it's permanent, so the outbox dead-letters the mail instead of retrying it.

#### Write your own transport

For a provider the package doesn't ship a transport for, extend `MailTransport`. Its `send()` gets the finished message and resolves once the provider has accepted it. A transport for Mailgun, whose `messages.mime` endpoint takes the message as MIME, the way `SesTransport` sends it to SES:

```typescript
@@filename(mail/mailgun.transport)
import {
  MailProviderError,
  MailTransport,
  type MailMessage,
  type MailTransportResult,
  type MailTransportSendOptions,
} from '@nestjs/mail';

export interface MailgunTransportOptions {
  domain: string;
  apiKey: string;
  /** `https://api.eu.mailgun.net` for a domain in the EU region. */
  baseUrl?: string;
}

/** Sends the finished MIME message through Mailgun's `messages.mime` endpoint. */
export class MailgunTransport extends MailTransport {
  readonly #apiKey: string;
  private readonly url: string;

  constructor({ domain, apiKey, baseUrl = 'https://api.mailgun.net' }: MailgunTransportOptions) {
    super();
    this.#apiKey = apiKey;
    this.url = `${baseUrl}/v3/${encodeURIComponent(domain)}/messages.mime`;
  }

  async send(message: MailMessage, { signal }: MailTransportSendOptions): Promise<MailTransportResult> {
    const form = new FormData();
    // The envelope names every recipient; the MIME message leaves Bcc out
    form.append('to', message.envelope.to.join(','));
    form.append('message', new Blob([new Uint8Array(message.toMime())]), 'message.eml');

    // An abort rejects with signal.reason; a network error is transient, so the mailer retries it
    const response = await fetch(this.url, {
      method: 'POST',
      headers: { authorization: `Basic ${Buffer.from(`api:${this.#apiKey}`).toString('base64')}` },
      body: form,
      signal: AbortSignal.any([signal, AbortSignal.timeout(30_000)]),
    });

    if (!response.ok) {
      const retryAfter = Number(response.headers.get('retry-after'));
      // Permanent for 4xx except 408, 409 and 429: those and 5xx are retried
      throw new MailProviderError({
        provider: 'mailgun',
        status: response.status,
        detail: await response.text(),
        ...(retryAfter > 0 && { retryAfterMs: retryAfter * 1_000 }),
      });
    }

    const { id } = (await response.json()) as { id?: string };
    return { accepted: message.envelope.to, providerMessageId: id };
  }
}
```

Pass an instance as `transport`, as with the built-in transports. `send(message, options)` gets:

- **`message`.** A `MailMessage`, validated and frozen: `from`, `to`, `cc`, `bcc`, `replyTo`, `subject`, `html`, `text`, `attachments`, `headers` and `messageId`. `envelope` holds the SMTP envelope, with every recipient once, Bcc included, and `toMime()` returns the message as MIME, without the Bcc header. It's the same object on every attempt.
- **`signal`.** Aborts when the caller cancels the send, such as the outbox relay when a handler outlives its timeout. Stop the request, and reject with `signal.reason`; the mailer doesn't retry an abort.
- **`idempotencyKey`.** The caller's key, the same on every attempt and every redelivery. Send it to a provider that deduplicates requests, as `ResendTransport` does; the `Message-ID` is already derived from it.
- **`attempt`.** 1 for the first attempt, 2 for the first retry.

It resolves to `accepted`, the envelope recipients the provider took (all of them when left out), `providerMessageId` and `response`, which the mailer's `send()` resolves to in turn.

What it throws decides whether the mailer retries. Throw a `MailError` whose `permanent` says whether sending the same message again can succeed: `MailProviderError` for an HTTP API's refusal, which is permanent for a 4xx status other than 408, 409 and 429 unless you pass `permanent` yourself, `MailConnectionError` and `MailTimeoutError` for a failed or slow request. Any other error counts as transient, unless it has `permanent: true` or a 4xx `status`, so a network error from `fetch` is retried. An error with `retryAfterMs` makes the mailer wait at least that long before the next attempt, up to `maxDelay`.

A transport that holds connections or a client implements `close()`, which runs on application shutdown, after the sends in flight have finished.

#### Try it

Apply the migrations, which also add two customers and four products:

```bash
$ export DATABASE_URL=postgres://localhost:5432/store
$ npx drizzle-kit migrate
```

Start the application with the defaults: the file transport, and the relay running. Place an order for Ada:

```bash
$ curl -X POST localhost:3000/orders \
    -H 'Content-Type: application/json' \
    -d '{"customerId":"ada","items":[{"productId":"salmon-kibble-2kg","quantity":2},{"productId":"feather-wand","quantity":1}]}'
{"id":"fd2bfc1c-db5c-455c-8876-bf7331a1029c","number":1001,"customerId":"ada","items":[{"productId":"salmon-kibble-2kg","name":"Salmon kibble, 2 kg","quantity":2,"price":2499},{"productId":"feather-wand","name":"Feather wand toy","quantity":1,"price":799}],"total":5797,"placedAt":"2026-09-25T10:59:00.173Z"}
```

The response comes back before any mail is sent. A moment later, the relay's handler renders the mail and the file transport writes it:

```bash
[Nest] 37252  - 09/25/2026, 12:59:00 PM     LOG [FileMailTransport] "Your order #1001" to ada@example.com written to var/mail/2026-09-25T10-59-00-199Z--LtIZd5B_AiZek3-x8nOt88YfUYjgkZi-42ff80.eml
```

The file is the message exactly as SMTP would transmit it. Its headers and text part:

```bash
$ head -33 var/mail/*.eml
From: Orders <orders@example.com>
To: Ada Lovelace <ada@example.com>
Subject: Your order #1001
Date: Fri, 25 Sep 2026 10:59:00 +0000
Message-ID: <-LtIZd5B_AiZek3-x8nOt88YfUYjgkZi@example.com>
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="=_bTCd1MQ5LoxTNFNN0nLRwu8d"

--=_bTCd1MQ5LoxTNFNN0nLRwu8d
Content-Type: multipart/alternative; boundary="=_9HVDyVBGuLsAaijTpu4Y2_XU"

--=_9HVDyVBGuLsAaijTpu4Y2_XU
Content-Type: text/plain; charset=utf-8
Content-Transfer-Encoding: quoted-printable

Hi Ada Lovelace,

thank you for your order! We are packing it now.

Product Qty Price
Salmon kibble, 2 kg 2 $49.98
Feather wand toy 1 $7.99

Total: $57.97

View your order (https://shop.example.com/orders/fd2bfc1c-db5c-455c-8876-bf=
7331a1029c)

Your invoice is attached.

The customer care team
--=_9HVDyVBGuLsAaijTpu4Y2_XU
Content-Type: multipart/related; boundary="=_u7PgKDXrb-x3mIz35ZArIBAa"
```

A few things to notice:

- The `Message-ID` is derived from the outbox message's id, not random. A redelivery would carry the same one.
- The text part was derived from the HTML, with the link written out.
- The body is quoted-printable, which keeps every line short enough for any mail server: the `=` at the end of the link's first line joins it with the next.

The HTML, the logo and the invoice follow:

```bash
$ grep -E '^Content-(Type|Disposition|ID):' var/mail/*.eml | tail -5
Content-Type: image/png; name="logo.png"
Content-Disposition: inline; filename="logo.png"
Content-ID: <logo@example.com>
Content-Type: application/pdf; name="invoice-1001.pdf"
Content-Disposition: attachment; filename="invoice-1001.pdf"
```

Open the file in a mail client to see the rendered mail. To work on the template, open the preview in a browser instead. The response is the mail's HTML, the template in the layout, with the logo inlined as a `data:` URL (shortened here):

```bash
$ curl localhost:3000/dev/mail/order-confirmation
```

```html
<!DOCTYPE html>
<html>
<body>
<p><img src="data:image/png;base64,…" alt="Logo" width="120" height="32"></p>
<p>Hi Ada Lovelace,</p>
<p>thank you for your order! We are packing it now.</p>
<table>
  <tr><th>Product</th><th>Qty</th><th>Price</th></tr>
  <tr>
    <td>Salmon kibble, 2 kg</td>
    <td>2</td>
    <td>$49.98</td>
  </tr>
  <tr>
    <td>Feather wand toy</td>
    <td>1</td>
    <td>$7.99</td>
  </tr>
</table>
<p><strong>Total: $57.97</strong></p>
<p><a href="https://shop.example.com/orders/00000000-0000-4000-8000-000000000000">View your order</a></p>
<p>Your invoice is attached.</p>

<p>The customer care team</p>
</body>
</html>
```

Next, order a product that doesn't exist:

```bash
$ curl -X POST localhost:3000/orders \
    -H 'Content-Type: application/json' \
    -d '{"customerId":"ada","items":[{"productId":"salmon-kibble-2kg","quantity":1},{"productId":"catnip-mouse","quantity":1}]}'
{"message":"Unknown product \"catnip-mouse\"","error":"Bad Request","statusCode":400}
```

The transaction rolls back, the `order.placed` message with it, and no mail is written.

Finally, see [the customer's language](/application/mail#send-it-in-the-customers-language) at work. Place an order for Zofia, who chose Polish at sign-up:

```bash
$ curl -X POST localhost:3000/orders \
    -H 'Content-Type: application/json' \
    -d '{"customerId":"zofia","items":[{"productId":"feather-wand","quantity":1}]}'
{"id":"7fa5ce1f-9ef3-49b0-8de9-a2d98056c299","number":1002,"customerId":"zofia","items":[{"productId":"feather-wand","name":"Feather wand toy","quantity":1,"price":799}],"total":799,"placedAt":"2026-09-25T10:59:00.424Z"}
```

```bash
[Nest] 37252  - 09/25/2026, 12:59:00 PM     LOG [FileMailTransport] "Twoje zamówienie #1002" to zofia@example.com written to var/mail/2026-09-25T10-59-00-453Z-GnMdyKUxVa0FRBJ6wZ2k5snIWsdQmwC2-697a51.eml
```

The body comes from `order-confirmation.pl.html`. The Polish subject and Zofia's name reach the file as encoded-words, and her invoice is `faktura-1002.pdf`:

```bash
$ head -3 var/mail/2026-09-25T10-59-00-453Z-GnMdyKUxVa0FRBJ6wZ2k5snIWsdQmwC2-697a51.eml
From: Orders <orders@example.com>
To: =?UTF-8?Q?Zofia_W=C3=B3jcik?= <zofia@example.com>
Subject: =?UTF-8?Q?Twoje_zam=C3=B3wienie_=231002?=
```

#### Testing

Replace the transport with `InMemoryMailTransport`. It keeps every mail it receives, and has helpers that find one and read it:

```typescript
@@filename(test/order-confirmation.e2e-spec)
import { PGlite } from '@electric-sql/pglite';
import { getDrizzleToken } from '@nestjs/drizzle';
import { InMemoryMailTransport, MailSmtpError, MailTransport } from '@nestjs/mail';
import { OutboxDeadLetters, OutboxRelay } from '@nestjs/outbox';
import { Test, type TestingModule } from '@nestjs/testing';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import * as schema from '../src/database/schema.js';
import { OrderConfirmationMail } from '../src/notifications/order-confirmation.mail.js';
import { OrdersService } from '../src/orders/orders.service.js';

describe('Order confirmation mail', () => {
  const client = new PGlite(); // PostgreSQL in-process
  const mailbox = new InMemoryMailTransport();
  let moduleRef: TestingModule;
  let orders: OrdersService;
  let relay: OutboxRelay;

  beforeAll(async () => {
    const db = drizzle(client, { schema });
    // Your migrations: the tables, and the seeded customers and products. The outbox's store
    // creates its own schema in init().
    await migrate(db, { migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)) });
    process.env.OUTBOX_RELAY = 'off'; // no poll loop: the test drives the relay
    moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(getDrizzleToken())
      .useValue(db) // the outbox's store runs on it too
      .overrideProvider(MailTransport)
      .useValue(mailbox)
      .compile();
    await moduleRef.init();
    orders = moduleRef.get(OrdersService);
    relay = moduleRef.get(OutboxRelay);
  });

  afterAll(async () => {
    await moduleRef.close();
    await client.close();
  });

  beforeEach(() => mailbox.clear());

  it('confirms the order with the invoice and a link to it', async () => {
    const order = await orders.placeOrder({ customerId: 'ada', items: [{ productId: 'salmon-kibble-2kg', quantity: 1 }] });
    mailbox.assertNotSent(); // nothing until the relay publishes the committed order

    await relay.runOnce();

    const mail = mailbox.assertSent({ to: 'ada@example.com', mail: OrderConfirmationMail });
    expect(mail.subject).toBe(`Your order #${order.number}`);
    expect(mail.attachment(`invoice-${order.number}.pdf`).contentType).toBe('application/pdf');
    expect(mail.link('/orders/').pathname).toBe(`/orders/${order.id}`);
  });

  it('dead-letters a confirmation the mail server refuses', async () => {
    mailbox.failNext(new MailSmtpError('RCPT TO', { code: 550, text: 'User unknown' }));
    await orders.placeOrder({ customerId: 'ada', items: [{ productId: 'salmon-kibble-2kg', quantity: 1 }] });

    await relay.runOnce();

    mailbox.assertNotSent();
    const [deadLetter] = await moduleRef.get(OutboxDeadLetters).list();
    expect(deadLetter).toMatchObject({ topic: 'order.placed', reason: 'rejected' });
  });
});
```

- **Everything but the network is real.** The mail class renders its templates, with the catalogs and the invoice provider, the outbox and its inbox run, and the message is fully built, headers and attachments included. Only delivery is replaced.
- **The database is PostgreSQL, in-process.** PGlite (`@electric-sql/pglite`, a dev dependency) runs your real migrations, and the test overrides the database `DrizzleModule` registers (its token comes from `getDrizzleToken()`) with it, so the repositories and the outbox store use it. There's no server to start, and each test file gets a fresh database.
- **`assertSent()`** returns the most recent mail that matches, by recipient (`to` matches to, cc and bcc), `subject`, mail class or `template`, or a predicate. When nothing matches, it throws an error that lists what was sent. `assertNotSent()`, `filter()`, `find()` and `mails` cover the rest. The helpers throw plain errors, so they work with any test runner.
- **`link()`** returns the first link in the mail that contains a string or matches a regular expression, as a `URL`. For a password reset or a magic link, that is the whole test: send the mail, then call `mail.link('/reset-password').searchParams.get('token')` and follow the link. Entities are decoded, so the `&amp;` that escaping writes in a query string is `&` again.
- **`failNext()`** makes the next send throw, here a permanent SMTP error, to test the error path.
- **`raw`** is the message as MIME, and `mailer.render()` renders a mail class or a template on its own, for unit tests of a template.

#### Production checklist

- Configure SPF, DKIM and DMARC for the sending domain. HTTP providers sign with DKIM once the domain is verified with them; with SMTP, sign with the `dkim` option or at the relay.
- Keep STARTTLS required, and certificate verification on. For a relay with a private CA, pass `tls.ca` instead of turning verification off.
- Keep credentials in the environment or a secret store. Transports hold them in private fields, and error messages never contain them.
- Send transactional mail after commit, through the outbox, with `retry: false` in the handler and the outbox's retry policy sized to how long your provider can be down.
- Pass `idempotencyKey` for every mail sent from a handler that can run twice.
- Turn permanent mail errors into dead letters, and alert on `dead-lettered` outbox events. A refused address usually means a typo at sign-up, or a mailbox that no longer exists.
- Watch `MailEvents`, or the `nestjs:mail:sent` and `nestjs:mail:failed` diagnostics channels, for delivery failures and slow sends.
- Send through `SmtpTransport` or an HTTP provider's transport in production. `FileMailTransport` writes to the local disk, which a container loses when it restarts or is replaced, and `LogMailTransport` only logs: both are for development, and `InMemoryMailTransport` is for tests. The module warns at startup when one of them runs with `NODE_ENV=production`.
- Keep the outbox's messages in the application's database, through `PostgresOutboxStore` or another registered store, so a queued mail commits with its order and survives a restart. Without a store, the outbox refuses to start with `NODE_ENV=production`, and so does the store while its migrations aren't applied: apply them on deploy, as [the outbox tutorial](/reliability/outbox#keep-messages-in-your-database) shows.
- Ship the templates to `dist` with the CLI's assets, and keep the template cache on in production, which is the default: `cache: false` rereads the files for every mail.
- Don't register development-only routes, such as the preview, in production.
- Use `app.enableShutdownHooks()`, so a deploy waits for the mails in flight and closes SMTP connections.

#### Reference

##### Module options

`MailModule.forRoot()` takes these options, and a `forRootAsync()` factory returns them. With `useClass` or `useExisting` in place of `useFactory`, the class implements `MailOptionsFactory`, whose `createMailOptions()` returns them. `transport`, `templates`, `imports` and `isGlobal` also sit next to `useFactory`, `useClass` or `useExisting` in `forRootAsync()`. The resolved options are provided under the `MAIL_MODULE_OPTIONS` token.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `transport` | `MailTransport` instance or class | none (required) | How mail leaves the application. A class is instantiated by Nest, so it can inject configuration. See [Send in production](/application/mail#send-in-production). |
| `templates` | `MailTemplateEngine` instance or class | none | Renders mail that names a `template`: `FileTemplateEngine`, or [your own](/application/mail#use-another-template-engine). A class is instantiated by Nest. Without one, a mail with a template fails with `MailTemplateError`. |
| `from` | address | none | The default sender. A message without a sender fails with `MailMessageError`. |
| `replyTo` | address or array | none | The default Reply-To. |
| `headers` | `Record<string, string>` | none | Added to every message. A message's own headers win. |
| `retry` | number, `false` or retry options | 3 attempts | Attempts per send, with backoff from `1s` doubling to `30s`, full jitter. `false` makes one attempt. See [Send after the order commits](/application/mail#send-after-the-order-commits). |
| `imports` | modules | none | Modules whose exports a transport or template engine class injects. |
| `isGlobal` | `boolean` | `true` | Registers `Mailer`, `MailEvents`, `MailTransport` and `MailTemplateEngine` globally. |

The retry options are `attempts` (total, including the first), `backoff` (an object with `delay`, `factor`, `maxDelay` and `jitter`, or a function of the attempt) and `retryIf` (can only narrow which transient errors are retried). When an HTTP provider answers with a `Retry-After` header, typically with a 429 or a 503, the error keeps it as `retryAfterMs`, and the mailer waits at least that long before the next attempt, up to `maxDelay` (`30s` with a backoff function). The `signal` still ends the wait. SMTP replies have no `Retry-After`, and an outbox handler with `retry: false` leaves the wait to the outbox's backoff.

##### Template engine

`FileTemplateEngine` takes:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `dir` | `string` | none (required) | The directory of the templates, with partials in its `partials/` folder. A relative path is resolved against the working directory. |
| `layout` | `string` | none | A template that wraps every mail's HTML, placing it with triple braces around `body`. A `.txt` version, if there is one, wraps the text. |
| `cache` | `boolean` | `true` | Keeps compiled templates, and which files exist, in memory. `false` reads the files for every mail, to see edits in development. |

`template: 'order-confirmation'` with the locale `pt-BR` renders the first file that exists of `order-confirmation.pt-BR.html`, `order-confirmation.pt.html` and `order-confirmation.html`, and the first of the same names with `.txt` as the text part, if any. Template names are letters, digits, `-` and `_`, in folders separated by `/`. Other names, and locales that aren't language tags, fail with `MailTemplateError`, so neither can reach a file outside `dir`.

##### Template syntax

The syntax is a subset of Handlebars:

<table>
  <tr>
    <th>Syntax</th>
    <th>Renders</th>
  </tr>
  <tr>
    <td><code>{{ '{' }}{{ '{' }} customer.name {{ '}' }}{{ '}' }}</code></td>
    <td>The value, HTML-escaped. Paths use dots, and <code>items.0</code> is an array's first item. A missing value renders as nothing. In a <code>.txt</code> template, the value as it is.</td>
  </tr>
  <tr>
    <td><code>{{ '{' }}{{ '{' }}{{ '{' }} body {{ '}' }}{{ '}' }}{{ '}' }}</code></td>
    <td>The value as it is, for HTML you produced yourself. HTML built with the <code>html</code> tag is inserted as it is between double braces too.</td>
  </tr>
  <tr>
    <td><code>{{ '{' }}{{ '{' }}#if paid{{ '}' }}{{ '}' }} … {{ '{' }}{{ '{' }}else{{ '}' }}{{ '}' }} … {{ '{' }}{{ '{' }}/if{{ '}' }}{{ '}' }}</code></td>
    <td>The first part when the value is truthy, else the <code>else</code> part, which is optional. <code>false</code>, <code>0</code>, an empty string, an empty list and a missing value are falsy. <code>{{ '{' }}{{ '{' }}else if pending{{ '}' }}{{ '}' }}</code> chains another condition.</td>
  </tr>
  <tr>
    <td><code>{{ '{' }}{{ '{' }}#unless paid{{ '}' }}{{ '}' }} … {{ '{' }}{{ '{' }}/unless{{ '}' }}{{ '}' }}</code></td>
    <td>The opposite of <code>#if</code>, with an optional <code>else</code> part.</td>
  </tr>
  <tr>
    <td><code>{{ '{' }}{{ '{' }}#each items{{ '}' }}{{ '}' }} … {{ '{' }}{{ '{' }}else{{ '}' }}{{ '}' }} … {{ '{' }}{{ '{' }}/each{{ '}' }}{{ '}' }}</code></td>
    <td>The first part once for every item of a list, or every value of an object; the <code>else</code> part for an empty or missing list.</td>
  </tr>
  <tr>
    <td><code>this, &#64;index, &#64;first, &#64;last, &#64;key</code></td>
    <td>Inside <code>#each</code>: the item, its position from 0, whether it's the first or the last, and an object's key. A name the item doesn't have is looked up in the outer contexts.</td>
  </tr>
  <tr>
    <td><code>../number, &#64;root.shop</code></td>
    <td>The context outside the current <code>#each</code>, and the template's context.</td>
  </tr>
  <tr>
    <td><code>{{ '{' }}{{ '{' }}> signature{{ '}' }}{{ '}' }}</code></td>
    <td>The partial <code>partials/signature.html</code> (<code>.txt</code> in a text template), in the mail's locale, with the context where it's included.</td>
  </tr>
  <tr>
    <td><code>{{ '{' }}{{ '{' }}! note {{ '}' }}{{ '}' }}, {{ '{' }}{{ '{' }}!-- note --{{ '}' }}{{ '}' }}</code></td>
    <td>Comments, left out of the output. The second form may contain double braces.</td>
  </tr>
  <tr>
    <td><code>\{{ '{' }}{{ '{' }}</code></td>
    <td>Literal double braces.</td>
  </tr>
</table>

There are no helpers and no expressions. Values are read from the context's own properties, never from a prototype, and functions aren't called. Anything else between double braces, a block that is never closed, and a double-braced value inside a tag but outside a quoted attribute value fail with `MailTemplateError`, which has the `file`, the `line` and the `column`.

##### Send options

`mailer.send(MailClass, options)` and `mailer.send(message)` take:

| Option | Description |
| --- | --- |
| `to`, `cc`, `bcc` | One address or an array. An address is a string holding exactly one address, or an object with `name` and `address`. `bcc` goes only into the SMTP envelope. |
| `data` | The mail class's data, typed from its `render()`. |
| `locale` | Passed to `render()` in the render context, and to the template engine, which picks the template for it. See [Send it in the customer's language](/application/mail#send-it-in-the-customers-language). |
| `from`, `replyTo` | Override the module's defaults. |
| `subject`, `html`, `text` | The content, for a message written inline. `text` is derived from `html` when omitted. |
| `template`, `context` | The template the body is rendered from, and the values it reads, in place of `html` and `text`. A mail class's `render()` returns them the same way. |
| `attachments` | Each has `filename`, `content` (a `Buffer`, string or stream) or a local `path`, and optionally `contentType` and `cid`. See [Attach the invoice and preview the mail](/application/mail#attach-the-invoice-and-preview-the-mail). |
| `headers` | Custom headers, such as `List-Unsubscribe`. |
| `retry` | Overrides the module's `retry` for this send. |
| `signal` | An `AbortSignal` that stops the send and any wait between attempts. |
| `idempotencyKey` | Identifies the mail across redeliveries. The `Message-ID` is derived from it. |

`mailer.render(MailClass, options)` and `mailer.render(message)` take the same without the delivery options, and resolve to the `MailMessage`, which records its `template` and `locale`. `send()` resolves to `messageId`, `providerMessageId` (when the provider has one), `accepted` (the accepted envelope recipients), `response` (the final SMTP reply) and `attempts`.

##### Transports

| Transport | Options | Idempotency key |
| --- | --- | --- |
| `SmtpTransport` | `url` or `host`, `port`, `secure`, `startTls` (`required`, `opportunistic` or `never`; `required` by default, `opportunistic` for localhost), `auth` (`user` with `pass` or `accessToken`), `authMethod` (`PLAIN`, `LOGIN` or `XOAUTH2`), `name`, `tls`, `pool`, `timeouts`, `dkim` (`domainName`, `keySelector`, `privateKey`, `headers`) | derived `Message-ID` only |
| `ResendTransport` | `apiKey`, `baseUrl`, `timeout`, `fetch` | `Idempotency-Key`, 24 hours |
| `PostmarkTransport` | `serverToken`, `messageStream` (default `outbound`), `baseUrl`, `timeout`, `fetch` | none |
| `SendGridTransport` | `apiKey`, `baseUrl`, `timeout`, `fetch` | none |
| `SesTransport` | `region`, `credentials`, `configurationSetName`, `endpoint`, `timeout`, `fetch` | none |
| `FileMailTransport` | `directory`, `log` | development only |
| `LogMailTransport` | `body`, `logger` | development only |
| `InMemoryMailTransport` | none | tests only, see [Testing](/application/mail#testing) |

`InMemoryMailTransport.mails` lists every mail received, oldest first, as a `SentMail`, which `filter()`, `find()` and `assertSent()` return too. A `SentMail` has the message's `messageId`, `from`, `to`, `cc`, `bcc`, `subject`, `html`, `text`, `attachments`, `headers`, `mail` (the mail class), `template` and `locale`, plus `sentAt` (when the transport received it), `raw` (the MIME source), `links` (every link, from the HTML, then the ones only the text part has), `link()`, `attachment()` and `message`, the `MailMessage` itself. `clear()` forgets them all.

With `pool: true`, `SmtpTransport` keeps up to 5 connections, sends up to 100 messages per connection, and closes a connection after 30 seconds idle; an object with `maxConnections`, `maxMessages` and `idleTimeout` as `pool` changes those limits. Its default timeouts are `30s` to connect, `30s` for the greeting, `1m` per command and `5m` for the data. HTTP providers time out after `30s` per request.

##### Events

`MailEvents.events$` emits one event per send, after its retries. Each event is also published on a `node:diagnostics_channel` channel.

| Event type | Channel | When | Payload |
| --- | --- | --- | --- |
| `sent` | `nestjs:mail:sent` | The transport accepted the message. | `messageId`, `mail`, `recipients`, `subject`, `transport`, `attempts`, `durationMs`, `providerMessageId` |
| `failed` | `nestjs:mail:failed` | The send failed after its retries, or its `signal` aborted before the first attempt (`attempts` is 0). | The same fields without `providerMessageId`, plus `error` and `permanent` |

A message that fails validation throws before any event.

##### Errors

Every error extends `MailError`, which has `permanent` (whether sending the same message again can't succeed) and `code` (the SMTP reply code or the provider's HTTP status). The mailer retries only errors that aren't permanent. See [Send after the order commits](/application/mail#send-after-the-order-commits).

| Error | When | Permanent |
| --- | --- | --- |
| `MailMessageError` | The message is invalid, before anything is sent. `field` names the field, `status` is 400. | Yes |
| `MailConnectionError` | DNS, a refused or reset connection, TLS or a certificate. `cause` holds the socket error. | No, except configuration problems such as a server without STARTTLS when it's required |
| `MailTimeoutError` | A phase outlived its timeout. Has `phase` and `timeoutMs`. | No |
| `MailSmtpError` | An SMTP error reply. Has `code`, `enhancedCode`, `command` and `response`. | For 5xx replies |
| `MailRecipientsRejectedError` | The server refused one or more recipients, and nothing was sent. `rejected` lists them. Extends `MailSmtpError`. | When any refusal is 5xx |
| `MailTemplateError` | A template is missing or doesn't compile, or a mail names a template without a template engine. Has `template`, and `file`, `line` and `column` for a problem in a file. | Yes |
| `MailProviderError` | An HTTP provider refused the request. Has `code` (the HTTP status), `provider`, `providerCode`, and `retryAfterMs` when the response had a valid `Retry-After`. | For 4xx except 408, 409 and 429 |
