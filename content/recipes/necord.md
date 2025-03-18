### Necord

Necord is a powerful module that simplifies the creation of [Discord](https://discord.com) bots, allowing for seamless integration with your NestJS application.

> info **Note** Necord is a third-party package and is not officially maintained by the NestJS core team. If you encounter any issues, please report them in the [official repository](https://github.com/necordjs/necord).

#### Installation

To get started, you need to install Necord alongside its dependency, [`Discord.js`](https://discord.js.org).

```bash
$ npm install necord discord.js
```

#### Usage

To utilize Necord in your project, import the `NecordModule` and configure it with the necessary options.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { NecordModule } from 'necord';
import { IntentsBitField } from 'discord.js';
import { AppService } from './app.service';

@Module({
  imports: [
    NecordModule.forRoot({
      token: process.env.DISCORD_TOKEN,
      intents: [IntentsBitField.Flags.Guilds],
      development: [process.env.DISCORD_DEVELOPMENT_GUILD_ID],
    }),
  ],
  providers: [AppService],
})
export class AppModule {}
```

> info **Hint** You can find a comprehensive list of available intents [here](https://discord.com/developers/docs/topics/gateway#gateway-intents).

With this setup, you can inject the `AppService` into your providers to easily register commands, events, and more.

```typescript
@@filename(app.service)
import { Injectable, Logger } from '@nestjs/common';
import { Context, On, Once, ContextOf } from 'necord';
import { Client } from 'discord.js';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  @Once('ready')
  public onReady(@Context() [client]: ContextOf<'ready'>) {
    this.logger.log(`Bot logged in as ${client.user.username}`);
  }

  @On('warn')
  public onWarn(@Context() [message]: ContextOf<'warn'>) {
    this.logger.warn(message);
  }
}
```

##### Understanding context

You may have noticed the `@Context` decorator in the examples above. This decorator injects the event context into your method, allowing you to access various event-specific data. Since there are multiple types of events, the context type is inferred using the `ContextOf<type: string>` type. You can easily access context variables by using the `@Context()` decorator, which fills the variable with an array of arguments relevant to the event.

#### Text commands

> warning **Caution** Text commands rely on message content, which is set to be deprecated for verified bots and applications with over 100 servers. This means that if your bot is unable to access message content, text commands will not function. Read more about this change [here](https://support-dev.discord.com/hc/en-us/articles/4404772028055-Message-Content-Access-Deprecation-for-Verified-Bots).

Here's how to create a simple command handler for messages using the `@TextCommand` decorator.

```typescript
@@filename(app.commands)
import { Injectable } from '@nestjs/common';
import { Context, TextCommand, TextCommandContext, Arguments } from 'necord';

@Injectable()
export class AppCommands {
  @TextCommand({
    name: 'ping',
    description: 'Responds with pong!',
  })
  public onPing(
    @Context() [message]: TextCommandContext,
    @Arguments() args: string[],
  ) {
    return message.reply('pong!');
  }
}
```

#### Application commands

Application commands provide a native way for users to interact with your app within the Discord client. There are three types of application commands that can be accessed through different interfaces: chat input, message context menu (accessed by right-clicking a message), and user context menu (accessed by right-clicking a user).

<figure><img class="illustrative-image" src="https://i.imgur.com/4EmG8G8.png" /></figure>

#### Slash commands

Slash commands are an excellent way to engage with users in a structured manner. They allow you to create commands with precise arguments and options, enhancing the user experience significantly.

To define a slash command using Necord, you can use the `SlashCommand` decorator.

```typescript
@@filename(app.commands)
import { Injectable } from '@nestjs/common';
import { Context, SlashCommand, SlashCommandContext } from 'necord';

@Injectable()
export class AppCommands {
  @SlashCommand({
    name: 'ping',
    description: 'Responds with pong!',
  })
  public async onPing(@Context() [interaction]: SlashCommandContext) {
    return interaction.reply({ content: 'Pong!' });
  }
}
```

> info **Hint** When your bot client logs in, it will automatically register all defined commands. Note that global commands are cached for up to an hour. To avoid issues with the global cache, utilize the `development` argument in the Necord module, which restricts command visibility to a single guild.

##### Options

You can define parameters for your slash commands using option decorators. Let's create a `TextDto` class for this purpose:

```typescript
@@filename(text.dto)
import { StringOption } from 'necord';

export class TextDto {
  @StringOption({
    name: 'text',
    description: 'Input your text here',
    required: true,
  })
  text: string;
}
```

You can then use this DTO in the `AppCommands` class:

```typescript
@@filename(app.commands)
import { Injectable } from '@nestjs/common';
import { Context, SlashCommand, Options, SlashCommandContext } from 'necord';
import { TextDto } from './length.dto';

@Injectable()
export class AppCommands {
  @SlashCommand({
    name: 'length',
    description: 'Calculate the length of your text',
  })
  public async onLength(
    @Context() [interaction]: SlashCommandContext,
    @Options() { text }: TextDto,
  ) {
    return interaction.reply({
      content: `The length of your text is: ${text.length}`,
    });
  }
}
```

For a complete list of built-in option decorators, check out [this documentation](https://necord.org/interactions/slash-commands#options).

##### Autocomplete

To implement autocomplete functionality for your slash commands, you'll need to create an interceptor. This interceptor will handle requests as users type in the autocomplete field.

```typescript
@@filename(cats-autocomplete.interceptor)
import { Injectable } from '@nestjs/common';
import { AutocompleteInteraction } from 'discord.js';
import { AutocompleteInterceptor } from 'necord';

@Injectable()
class CatsAutocompleteInterceptor extends AutocompleteInterceptor {
  public transformOptions(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused(true);
    let choices: string[];

    if (focused.name === 'cat') {
      choices = ['Siamese', 'Persian', 'Maine Coon'];
    }

    return interaction.respond(
      choices
        .filter((choice) => choice.startsWith(focused.value.toString()))
        .map((choice) => ({ name: choice, value: choice })),
    );
  }
}
```

You will also need to mark your options class with `autocomplete: true`:

```typescript
@@filename(cat.dto)
import { StringOption } from 'necord';

export class CatDto {
  @StringOption({
    name: 'cat',
    description: 'Choose a cat breed',
    autocomplete: true,
    required: true,
  })
  cat: string;
}
```

Finally, apply the interceptor to your slash command:

```typescript
@@filename(cats.commands)
import { Injectable, UseInterceptors } from '@nestjs/common';
import { Context, SlashCommand, Options, SlashCommandContext } from 'necord';
import { CatDto } from '/cat.dto';
import { CatsAutocompleteInterceptor } from './cats-autocomplete.interceptor';

@Injectable()
export class CatsCommands {
  @UseInterceptors(CatsAutocompleteInterceptor)
  @SlashCommand({
    name: 'cat',
    description: 'Retrieve information about a specific cat breed',
  })
  public async onSearch(
    @Context() [interaction]: SlashCommandContext,
    @Options() { cat }: CatDto,
  ) {
    return interaction.reply({
      content: `I found information on the breed of ${cat} cat!`,
    });
  }
}
```

#### User context menu

User commands appear on the context menu that appears when right-clicking (or tapping) on users. These commands provide quick actions that target users directly.

```typescript
@@filename(app.commands)
import { Injectable } from '@nestjs/common';
import { Context, UserCommand, UserCommandContext, TargetUser } from 'necord';
import { User } from 'discord.js';

@Injectable()
export class AppCommands {
  @UserCommand({ name: 'Get avatar' })
  public async getUserAvatar(
    @Context() [interaction]: UserCommandContext,
    @TargetUser() user: User,
  ) {
    return interaction.reply({
      embeds: [
        new MessageEmbed()
          .setTitle(`Avatar of ${user.username}`)
          .setImage(user.displayAvatarURL({ size: 4096, dynamic: true })),
      ],
    });
  }
}
```

#### Message context menu

Message commands show up in the context menu when right-clicking on messages, allowing for quick actions relevant to those messages.

```typescript
@@filename(app.commands)
import { Injectable } from '@nestjs/common';
import { Context, MessageCommand, MessageCommandContext, TargetMessage } from 'necord';
import { Message } from 'discord.js';

@Injectable()
export class AppCommands {
  @MessageCommand({ name: 'Copy Message' })
  public async copyMessage(
    @Context() [interaction]: MessageCommandContext,
    @TargetMessage() message: Message,
  ) {
    return interaction.reply({ content: message.content });
  }
}
```

#### Buttons

[Buttons](https://discord.com/developers/docs/interactions/message-components#buttons) are interactive elements that can be included in messages. When clicked, they send an [interaction](https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object) to your application.

```typescript
@@filename(app.components)
import { Injectable } from '@nestjs/common';
import { Context, Button, ButtonContext } from 'necord';

@Injectable()
export class AppComponents {
  @Button('BUTTON')
  public onButtonClick(@Context() [interaction]: ButtonContext) {
    return interaction.reply({ content: 'Button clicked!' });
  }
}
```

#### Select menus

[Select menus](https://discord.com/developers/docs/interactions/message-components#select-menus) are another type of interactive component that appears on messages. They provide a dropdown-like UI for users to select options.

```typescript
@@filename(app.components)
import { Injectable } from '@nestjs/common';
import { Context, StringSelect, StringSelectContext, SelectedStrings } from 'necord';

@Injectable()
export class AppComponents {
  @StringSelect('SELECT_MENU')
  public onSelectMenu(
    @Context() [interaction]: StringSelectContext,
    @SelectedStrings() values: string[],
  ) {
    return interaction.reply({ content: `You selected: ${values.join(', ')}` });
  }
}
```

For a full list of built-in select menu components, visit [this link](https://necord.org/interactions/message-components#select-menu).

#### Modals

Modals are pop-up forms that allow users to submit formatted input. Here's how to create and handle modals using Necord:

```typescript
@@filename(app.modals)
import { Injectable } from '@nestjs/common';
import { Context, Modal, ModalContext } from 'necord';

@Injectable()
export class AppModals {
  @Modal('pizza')
  public onModal(@Context() [interaction]: ModalContext) {
    return interaction.reply({
      content: `Your fav pizza : ${interaction.fields.getTextInputValue('pizza')}`
    });
  }
}
```

#### More information

Visit the [Necord](https://necord.org) website for more information.
