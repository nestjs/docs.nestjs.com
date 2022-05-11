### Nestia
Automatic [SDK](#software-development-kit) and [Swagger](#swagger) generator for the [NestJS](https://www.nestjs.com).

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/samchon/nestia/blob/master/LICENSE)
[![npm version](https://badge.fury.io/js/nestia.svg)](https://www.npmjs.com/package/nestia)
[![Downloads](https://img.shields.io/npm/dm/nestia.svg)](https://www.npmjs.com/package/nestia)
[![Build Status](https://github.com/samchon/nestia/workflows/build/badge.svg)](https://github.com/samchon/nestia/actions?query=workflow%3Abuild)

  - Github: https://github.com/samchon/nestia
  - NPM: https://www.npmjs.com/packages/nestia
  - Guide Documents: https://github.com/samchon/nestia/wiki

```bash
# INSTALL NESTIA
npm install --save-dev nestia

# BUILDING SDK LIBRARY
npx nestia sdk "src/controller" --out "src/api"
npx nestia sdk "src/**/*.controller.ts" --out "src/api"
npx nestia sdk "src/controller" \ 
    --exclude "src/controller/test" \
    --out "src/api"

# BUILDING SWAGGER.JSON IS ALSO POSSIBLE
npx nestia swagger "src/controller" -- out "swagger.json"
```

The nestia is an evolved automatic [SDK](#software-development-kit) and [Swagger](#swagger) generator than ever, who does not require any type of swagger comment or DTO decorator function, as it can analyze the [NestJS](https://www.nestjs.com) developed backend server code in the compilation level.

Therefore, don't write any swagger comment and don't use any DTO related decorator function. Just use the pure interface type with pure the [NestJS](https://www.nestjs.com) code. Click the below arrow buttons, then example DTO code would be shown. By looking at those example codes, feel how nestia is much powerful than the legacy [@nestjs/swagger](https://docs.nestjs.com/openapi/types-and-parameters).

<details>
    <summary> Pure interface type, who can be used as a DTO by the <code>nestia</code> </summary>

```typescript
// The nestia can utilize the pure interface type as DTO
/**
 * Comment wrote on a sale related article.
 * 
 * When an article of a sale has been enrolled, all of the participants like consumers and
 * sellers can write a comment on that article. However, when the writer is a consumer, the
 * consumer can hide its name through the annoymous option. 
 * 
 * Also, writing a reply comment for a specific comment is possible and in that case, the 
 * {@link ISaleArticleComment.parent_id} property would be activated.
 * 
 * @author Jeongho Nam - https://github.com/samchon
 */
export interface ISaleArticleComment
{
    /**
     * Primary Key.
     */
    id: number;

    /**
     * Parent comment ID.
     * 
     * Only When this comment has been written as a reply.
     */
    parent_id: number | null;

    /**
     * Type of the writer.
     */
    writer_type: "seller" | "consumer";

    /**
     * Name of the writer.
     * 
     * When this is a type of anonymous comment, writer name would be hidden.
     */
    writer_name: string | null;

    /**
     * Contents of the comments.
     * 
     * When the comment writer tries to modify content, it would not modify the comment
     * content but would be accumulated. Therefore, all of the people can read how
     * the content has been changed.
     */
    contents: ISaleArticleComment.IContent[];

    /**
     * Creation time.
     */
    created_at: string;
}

export namespace ISaleArticleComment
{
    /**
     * Store info.
     */
    export interface IStore
    {
        /**
         * Body of the content.
         */
        body: string;

        /**
         * Whether to hide the writer name or not.
         */
        annonymous: boolean;
    }

    /**
     * Content info.
     */
    export interface IContent
    {
        /**
         * Primary Key.
         */
        id: string;

        /**
         * Body of the content.
         */
        body: string;

        /**
         * Creation time.
         */
        created_at: string;
    }
}
```
</details>

<details>
    <summary> Legacy DTO class, for the <code>@nestjs/swagger</code> </summary>

```typescript
/*
The @nest/swagger must define the DTO class with decorator functions.

Sorry for the non-completed implementation. It's too hard for me to implement the full DTO class same like the pure interface type `ISaleArticleComment`. Using the DTO decorator functions of the `@nestjs/swagger`, I feel annoyance again that I haven't felt in a long time.
*/
//----------------------------------- 
export class SaleArticleComment
{
    @ApiProperty({
        description: 
`Comment wrote on a sale related article.

When an article of a sale has been enrolled, all of the participants like consumers and sellers can write a comment on that article. However, when the writer is a consumer, the consumer can hide its name through the annoymous option.

Also, writing a reply comment for a specific comment is possible and in that case, the ISaleArticleComment.parent_id property would be activated.`
    })
    id: number;

    @ApiProperty({
        type: "number",
        nullable: true,
        description:
`Parent comment ID.

Only When this comment has been written as a reply.`
    })
    parent_id: number | null;

    @ApiProperty({
        type: "string",
        description: "Type of the writer."
    })
    writer_type: "seller" | "consumer";

    @ApiProperty({
        type: "string",
        nullable: true,
        description:
`Name of the writer.

When this is a type of anonymous comment, writer name would be hidden.`
    })
    writer_name: string | null;

    @ApiProperty({
        type: "array",
        items: {
            schema: { $ref: getSchemaPath(SaleArticleComment.Content) }
        },
        description:
`Contents of the comments.

When the comment writer tries to modify content, it would not modify the comment content but would be accumulated Therefore, all of the people can read how the content has been changed.`
    })
    contents: SaleArticleComment.Content[];

    @ApiProperty({
        description: "Creation time."
    })
    created_at: string;
}
```
</details>




#### Software Development Kit
[Swagger](#swagger) is a tool torturing the client developers.

If you're a backend developer and you deliver a [swagger.json](#swagger) to your companion client developers, the client developers should analyze the [swagger.json](#swagger) and implement duplicated router functions with DTO interfaces by themselves. During the analysis, if the client developers mis-read the [swagger.json](#swagger), therefore take a mistake, it becomes the critical runtime error directly.

Why are you torturing client developers such like that? If you deliver an SDK (Software Development Kit) instead of the [swagger.json](#swagger), the client developers don't need to read the [swagger.json](#swagger) file and don't need to implement the duplicated DTO interfaces and router functions, either.

Just build the SDK through this [nestia](https://github.com/samchon/nestia) and delivers the SDK. Your client developers would be anticipated from the long time torturing and becom happy. Your solution would be much more reliable and efficient, too.

```typescript
// IMPORT SDK LIBRARY WHO'VE BEEN GENERATED BY THE NESTIA
import api from "@samchon/shopping-api";
import { IPage } from "@samchon/shopping-api/lib/structures/IPage";
import { ISale } from "@samchon/shopping-api/lib/structures/ISale";
import { ISaleArticleComment } from "@samchon/shopping-api/lib/structures/ISaleArticleComment";
import { ISaleQuestion } from "@samchon/shopping-api/lib/structures/ISaleQuestion";

export async function trace_sale_question_and_comment
    (connection: api.IConnection): Promise<void>
{
    // LIST UP SALE SUMMARIES
    const index: IPage<ISale.ISummary> = await api.functional.shoppings.sales.index
    (
        connection,
        "general",
        { limit: 100, page: 1 }
    );

    // PICK A SALE
    const sale: ISale = await api.functional.shoppings.sales.at
    (
        connection, 
        index.data[0].id
    );
    console.log("sale", sale);

    // WRITE A QUESTION
    const question: ISaleQuestion = await api.functional.shoppings.sales.questions.store
    (
        connection,
        "general",
        sale.id,
        {
            title: "How to use this product?",
            body: "The description is not fully enough. Can you introduce me more?",
            files: []
        }
    );
    console.log("question", question);

    // WRITE A COMMENT
    const comment: ISaleArticleComment = await api.functional.shoppings.sales.comments.store
    (
        connection,
        "general",
        sale.id,
        question.id,
        {
            body: "p.s) Can you send me a detailed catalogue?",
            anonymous: false
        }
    );
    console.log("comment", comment);
}
```



#### Swagger
Building [swagger.json](#swagger) is also possible and much powerful.

Although I think [swagger.json](#swagger) is a typical tool torturing the client developers, the [nestia](https://github.com/samchon/nestia) also can build the [swagger.json](#swagger) file. Even [swagger.json](#swagger) generator of the [nestia](https://github.com/samchon/nestia) is much powerful and convenient than the [@nestjs/swagger](https://docs.nestjs.com/openapi/types-and-parameters).

Components | [nestia](https://github.com/samchon/nestia)::SDK | [nestia](https://github.com/samchon/nestia)::swagger | [@nestjs/swagger](https://docs.nestjs.com/openapi/types-and-parameters)
-----------|---|---|---
DTO with pure interface | ✔ | ✔ | ❌
descriptions by comments | ✔ | ✔ | ❌
Simple structure | ✔ | ✔ | ✔
Generic typed structure | ✔ | ✔ | ❌
Union typed structure | ✔ | ✔ | ▲
Intersection typed structure | ✔ | ✔ | ▲
Conditional typed structure | ✔ | ▲ | ❌
Auto completion | ✔ | ❌ | ❌
Type hints | ✔ | ❌ | ❌
2x faster `JSON.stringify()` | ✔ | ❌ | ❌
Ensure type safety | ✔ | ❌ | ❌




#### Demonstration
##### DTO Interfaces
##### Controller Classes
##### SDK Functions
##### `swagger.json`