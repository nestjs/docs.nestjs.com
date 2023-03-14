### Necord

This module provides fast and easy way for creating [Discord](https://discord.com) bots and deep integration with your NestJS application.

> info **info** `Necord` is a third party package and is not managed by the NestJS core team. Please, report any issues found with the library in the [appropriate repository](https://github.com/necordjs/necord).

#### Installation

Just like any other package, you've got to install necord and its dependency, [`Discord.js`](https://discord.js.org) before you can use it.

```bash
$ npm i necord discord.js
```

> info **Hint** You need to install [Node.js](https://nodejs.org/) v16.0.0 or newer to use `Necord` and `Discord.js`.

#### Usage

To use `Necord` you need to import the `NecordModule` and pass it the configuration options.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { DiscordService } from './discord.service';
import { IntentsBitField } from 'discord.js';

@Module({
    imports: [
        NecordModule.forRoot({
            token: process.env.DISCORD_TOKEN,
            intents: [IntentsBitField.Guilds],
            development: [process.env.DISCORD_DEVELOPMENT_GUILD_ID]
        })
    ],
    providers: [AppService]
})
export class AppModule {}
```

> info **Hint** You can find the list of intents [here](https://discord.com/developers/docs/topics/gateway#gateway-intents).

Now you can inject the `AppService` into your providers and use it to register your commands, events, etc.

```typescript
@@filename(app.service)
import { Injectable, Logger } from '@nestjs/common';
import { Once, On, Context, ContextOf } from 'necord';

@Injectable()
export class AppService {
    private readonly logger = new Logger(DiscordService.name);

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

##### Context

You might have noticed the `@Context` decorator in the last snippet: This is used to inject the event context within the method. As there are many type of events, its type must be inferred from the `ContextOf<type: string>` type.

You can access the context variables by using the `@Context()` decorator within your function, which will populate the variable with an array of arguments.


#### Text Commands

> warning **caution** A text command is dependent on the content of the message but unfortunately, Discord plans to remove message content for verified bots and apps, those with 100 or more servers. Hence, You cannot use text commands if your bot cannot access message content.<br/>[Read discord message here](https://support-dev.discord.com/hc/en-us/articles/4404772028055-Message-Content-Access-Deprecation-for-Verified-Bots)

Create a simple command handler for messages using `@TextCommand`.

```typescript
@@filename(app.commands)
import { Injectable } from '@nestjs/common';
import { Context, TextCommand, TextCommandContext, Arguments } from 'necord';

@Injectable()
export class AppCommands {
    @TextCommand({
        name: 'ping',
        description: 'Ping command!',
    })
    public onPing(@Context() [message]: TextCommandContext, @Arguments() args: string[]) {
        return message.reply('pong!');
    }
}
```

#### Application Commands

Application commands are native ways to interact with apps in the Discord client. There are 3 types of commands accessible in different interfaces: the chat input, a message's context menu (top-right menu or right-clicking in a message), and a user's context menu (right-clicking on a user).

<figure><img src="https://i.imgur.com/4EmG8G8.png" /></figure>

#### Slash Commands

The best way to interact with your users is to use [Slash commands](https://support.discord.com/hc/en-us/articles/1500000368501-Slash-Commands-FAQ)!
Slash commands allow you to create commands with precise arguments and choices, giving users the best experience.

To create a command with Necord, you can use the `SlashCommand` decorator.

```typescript
@@filename(app.commands)
import { Injectable } from '@nestjs/common';
import { Context, SlashCommand, SlashCommandContext } from 'necord';

@Injectable()
export class AppCommands {
    @SlashCommand({
        name: 'ping',
        description: 'Ping command!'
    })
    public async onPing(@Context() [interaction]: SlashCommandContext) {
        return interaction.reply({ content: 'Pong!' });
    }
}
```

> info **Hint** When the client logs in, it will automatically register all of the commands.
Global commands are cached for up to an hour, therefore to avoid the global commands cache, you should use the `development` argument on the Necord module. This will restrict the command to a single guild, preventing it from getting caught by the cache.

##### Options

Use the option decorator to define a parameter in a slash command, let's create the `TextDto` class:

```typescript
@@filename(text.dto)
import { StringOption } from 'necord';

export class TextDto {
    @StringOption({
        name: 'text',
        description: 'Your text',
        required: true
    })
    text: string;
}
```

It has only one basic properties. Thereafter we can use the newly created DTO inside the `AppCommands`:

```typescript
@@filename(app.commands)
import { Injectable } from '@nestjs/common';
import { Context, SlashCommand, Options, SlashCommandContext } from 'necord';
import { TextDto } from './text.dto';

@Injectable()
export class AppCommands {
    @SlashCommand({
        name: 'length',
        description: 'Get length of text'
    })
    public async onLength(@Context() [interaction]: SlashCommandContext, @Options() { text }: TextDto) {
        return interaction.reply({content: `Length of your text ${text.length}`});
    }
}
```

List of all built-in option decorators:

| Decorator           | Type                          | Description          |
| :------------------ | :---------------------------- | :------------------- |
| `StringOption`      | `string`                      | A string option      |
| `NumberOption`      | `number`                      | A number option      |
| `IntegerOption`     | `number`                      | An integer option    |
| `BooleanOption`     | `boolean`                     | A boolean option     |
| `UserOption`        | `User`                        | A user option        |
| `MemberOption`      | `GuildMember`                 | A member option      |
| `ChannelOption`     | `GuildChannel`                | A channel option     |
| `RoleOption`        | `Role`                        | A role option        |
| `MentionableOption` | `GuildMember \| Role \| User` | A mentionable option |
| `AttachmentOption`  | `AttachmentOption`            | An attachment option |

##### Autocomplete

To add autocomplete to your Slashcommand you will need a interceptor first. This class will intercept all requests from the user after typing in the autocomplete option field.

```typescript
@@filename(anime.interceptor)
import { Injectable, UseInterceptors } from '@nestjs/common';
import { AutocompleteInteraction, CommandInteraction } from 'discord.js';
import { AutocompleteInterceptor } from 'necord';

@Injectable()
class AnimeAutocompleteInterceptor extends AutocompleteInterceptor {
    public transformOptions(interaction: AutocompleteInteraction) {
        const focused = interaction.options.getFocused(true);
        let choices: string[];

        if (focused.name === 'anime') {
            choices = ['Hunter x Hunter', 'Naruto', 'One Piece'];
        }

        return interaction.respond(
            choices
                .filter(choice => choice.startsWith(focused.value.toString()))
                .map(choice => ({ name: choice, value: choice }))
        );
    }
}
```

You'll then have to add `autocomplete: true` to your options class:

```typescript
@@filename(anime.dto)
import { StringOption } from 'necord';

export class AnimeDto {
    @StringOption({
        name: 'anime',
        description: 'The anime to look up',
        autocomplete: true,
        required: true
    })
    anime: string;
}
```

And last but not least, apply the interceptor to your slash command:

```typescript
@@filename(anime.commands)
import { Injectable, UseInterceptors } from '@nestjs/common';
import { Context, SlashCommand, Options, SlashCommandContext } from 'necord';
import { AnimeDto } from './anime.dto';
import { AnimeAutocompleteInterceptor } from './anime.interceptor';

@Injectable()
export class AnimeCommands {
    @UseInterceptors(AnimeAutocompleteInterceptor)
    @SlashCommand({
        name: 'anime',
        description: 'Lookup information about an anime'
    })
    public async onSearch(@Context() [interaction]: SlashCommandContext, @Options() { anime }: AnimeDto) {
        return interaction.reply({content: `I found the anime ${anime}`});
    }
}
```

#### User Context Menu

**User commands** are application commands that appear on the context menu (right click or tap) of users. They're a great way to surface quick actions for your app that target users.

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
        @TargetUser() user: User
    ) {
        return interaction.reply({
            embeds: [
                new MessageEmbed()
                    .setTitle(`Avatar ${user.username}`)
                    .setImage(user.displayAvatarURL({ size: 4096, dynamic: true }))
            ]
        });
    }
}
```

#### Message Context Menu

**Message commands** are application commands that appear on the context menu (right click or tap) of messages. They're a great way to surface quick actions for your app that target messages.

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
        @TargetMessage() message: Message
    ) {
        return interaction.reply({ content: message.content });
    }
}
```

#### Buttons

[Buttons](https://discord.com/developers/docs/interactions/message-components#buttons) are interactive components that render on messages. They can be clicked by users, and send an [interaction](https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object) to your app when clicked.


```typescript
@@filename(app.components)
import { Injectable } from '@nestjs/common';
import { Context, Button, ButtonContext } from 'necord';

@Injectable()
export class AppComponents {
    @Button('BUTTON')
    public onButton(@Context() [interaction]: ButtonContext) {
        return interaction.reply({ content: 'Button clicked!' });
    }
}
```

#### Select Menus

[Select menus](https://discord.com/developers/docs/interactions/message-components#select-menus) are another interactive component that renders on messages. On desktop, clicking on a select menu opens a dropdown-style UI; on mobile, tapping a select menu opens up a half-sheet with the options.

```typescript
@@filename(app.components)
import { Injectable } from '@nestjs/common';
import { Context, StringSelect, StringSelectContext, Values } from 'necord';

@Injectable()
export class AppComponents {
    @StringSelect('SELECT_MENU')
    public onSelectMenu(@Context() [interaction]: StringSelectContext, @Values() values: string[]) {
        return interaction.reply({ content: `Your selected color - ${values.join(' ')}` });
    }
}
```

All of built-in select menu components:
- `@StringSelect`
- `@UserSelect`
- `@RoleSelect`
- `@MentionableSelect`
- `@ChannelSelect`

#### Modals

With [modals](https://discord.com/developers/docs/interactions/message-components#text-inputs) you can create pop-up forms that allow users to provide you with formatted inputs through submissions. We'll cover how to create, show, and receive modal forms using necord

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

#### More Information

Visit the [Necord](https://necord.org) website for more information, examples.
