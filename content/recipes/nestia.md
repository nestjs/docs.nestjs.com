### Nestia

[Nestia](https://github.com/samchon/nestia) is an evolved `SDK` and `Swagger` generator than ever. 

Also, it does not require any DTO class and decorator function. Instead, pure interface type can replace it. 

Furthermore, it supports generic, union and conditional types, even containing not only DTOs but also controllers.

  - [Guide Documents](https://github.com/samchon/nestia/wiki)




#### Setup

Just like any other package, you've got to install it before you can use it.

For reference, `ttypescript` is not mis-writing. Don't forget to install it.

```sh
npm install --save-dev nestia

npm install --save-dev typscript
npm install --save-dev ts-node
npm install --save-dev ttypescript
```

After the installation, you can generate the `SDK` or `Swagger`, directly.

```sh
npx nestia sdk "src/**/*.controller" --out "src/api"
npx nestia swagger "src/**/*.controller" --out "swagger.json"
```

If all of your controller files are gathered into one directory:

```sh
npx nestia sdk "src/controllers" --out "src/api"
npx nestia swagger "src/controllers" --out "swagger.json"
```




#### Pure DTO Interface

`nestia` can utilize pure interface type as DTO.

Also, `nestia` understands descriptive comments and resurrects them in SDK and Swagger.

```typescript
@@filename(ISaleArticleComment)
/**
 * Comment wrote on a sale related article.
 * 
 * When an article of a sale has been enrolled, all of the participants like 
 * consumers and sellers can write a comment on that article. However, when 
 * the writer is a consumer, the consumer can hide its name through the 
 * annoymous option. 
 * 
 * @author Someone
 */
export interface ISaleArticleComment extends ISaleArticleComment.IStore {
    /**
     * Primary Key.
     */
    id: string;

    /**
     * Who've written the comment.
     */
    writer: string;

    /**
     * Creation time.
     */
    created_at: string;
}
export namespace ISaleArticleComment {
    /**
     * Store info.
     */
    export interface IStore {
        /**
         * Body of the content.
         */
        body: string;

        /**
         * Extension, content type (format).
         */
        extension: "html" | "md" | "txt";

        /**
         * Whether to hide the writer name or not.
         */
        anonymous?: boolean | null;
    }
}
```




#### Advanced Controller Class

`nestia` also can understand descriptive comments in the controller class.

Also, you can validate request body data from client automatically, by using [nestia-helper](https://github.com/samchon/nestia-helper). 

Furthermore, `nestia-helper` boosts up `JSON.stringify()` speed about 5x times faster.

```typescript
@@filename(ConsumerSaleArticleCommentsController)
import express from "express";
import { Controller, Param, Request } from "@nestjs/common";
import { TypedBody, TypedRoute } from "nestia-helper";

import { ISaleArticleComment } from "../api/structures/ISaleArticleComment";

@Controller("consumers/:section/sales/:saleId/articles/:articleId/comments")
export class ConsumerSaleArticleCommentsController {
    /**
     * Store a new comment.
     *
     * Write a comment on a sale article. If you configure the comment to be
     * `anonymous`, only administrator, you and seller of the sale can read
     * the content.
     *
     * @param request Instance of the Express.Request
     * @param sectionCode Code of the target section
     * @param saleId ID of the target sale
     * @param articleId ID of the target article
     * @param body Content to write
     * @return Newly archived comment
     *
     * @throw 400 bad request error when type of the input data is not valid
     * @throw 401 unauthorized error when you've not logged in yet
     * @throw 403 forbidden error when you're a seller and the sale is not yours
     * @throw 404 not found error when unable to find the matched record
     */
    @TypedRoute.Post() // 5x faster JSON.stringify()
    public async store(
        @Request() request: express.Request,
        @Param("section") sectionCode: string,
        @Param("saleId") saleId: string,
        @Param("articleId") articleId: string,
        @TypedBody() body: ISaleArticleComment.IStore, // auto validation
    ): Promise<ISaleArticleComment>;
}
@@switch
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsumerSaleArticleCommentsController = void 0;
const common_1 = require("@nestjs/common");
const nestia_helper_1 = require("nestia-helper");
let ConsumerSaleArticleCommentsController = class ConsumerSaleArticleCommentsController {
    async store(request, sectionCode, saleId, articleId, body);
};
__decorate([
    nestia_helper_1.TypedRoute.Post(input => {
        const $number = nestia_helper_1.TypedRoute.Post.number;
        const $string = nestia_helper_1.TypedRoute.Post.string;
        const $io = [
            input => "number" === typeof input.id && Number.isFinite(input.id) && !Number.isNaN(input.id) && (null === input.parent_id || "number" === typeof input.parent_id && Number.isFinite(input.parent_id) && !Number.isNaN(input.parent_id)) && ("seller" === input.writer_type || "consumer" === input.writer_type) && (null === input.writer_name || "string" === typeof input.writer_name) && (Array.isArray(input.contents) && input.contents.every(elem => null !== elem && ("object" === typeof elem && null !== elem && $io[1](elem)))) && "string" === typeof input.created_at,
            input => "string" === typeof input.id && "string" === typeof input.body && "string" === typeof input.created_at
        ];
        const $so = [
            input => `{"id":${$number(input.id)},"parent_id":${null !== input.parent_id ? $number(input.parent_id) : "null"},"writer_type":${"\"" + input.writer_type + "\""},"writer_name":${null !== input.writer_name ? $string(input.writer_name) : "null"},"contents":${`[${input.contents.map(elem => $so[1](elem)).join(",")}]`},"created_at":${$string(input.created_at)}}`,
            input => `{"id":${$string(input.id)},"body":${$string(input.body)},"created_at":${$string(input.created_at)}}`
        ];
        return $so[0](input);
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("section")),
    __param(2, (0, common_1.Param)("saleId")),
    __param(3, (0, common_1.Param)("articleId")),
    __param(4, (0, nestia_helper_1.TypedBody)(input => { ((input, path = "$input") => {
        const $pred = nestia_helper_1.TypedBody.predicate;
        const $ao = [
            (input, path, exceptionable) => $pred("string" === typeof input.body, exceptionable, () => ({
                path: path + ".body",
                expected: "string",
                value: input.body
            })) && ("html" === input.extension || "md" === input.extension || "txt" === input.extension) && $pred("boolean" === typeof input.annonymous, exceptionable, () => ({
                path: path + ".annonymous",
                expected: "boolean",
                value: input.annonymous
            }))
        ];
        return $pred(null !== input && $pred("object" === typeof input && null !== input && $ao[0](input, path + "", true), true, () => ({
            path: path + "",
            expected: "Resolve<ISaleArticleComment.IStore>",
            value: input
        })), true, () => ({
            path: path + "",
            expected: "Resolve<ISaleArticleComment.IStore>",
            value: input
        }));
    })(input); return input; })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ConsumerSaleArticleCommentsController.prototype, "store", null);
ConsumerSaleArticleCommentsController = __decorate([
    (0, common_1.Controller)("consumers/:section/sales/:saleId/articles/:articleId/comments")
], ConsumerSaleArticleCommentsController);
exports.ConsumerSaleArticleCommentsController = ConsumerSaleArticleCommentsController;
```




#### Software Development Kit

Looking at SDK library files generated by `nestia`, it is perfect.

Route method, path and parameters are well-formed and DTO structures are correctly imported. 

Also, descriptive comments are fully revived in the SDK library, regardless of where they are written.

```typescript
@@filename(src/api/functional/consumers/sales/articles/comments/index.ts)
/**
 * @packageDocumentation
 * @module api.functional.consumers.sales.articles.comments
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
//================================================================
import { Fetcher, Primitive } from "nestia-fetcher";
import type { IConnection } from "nestia-fetcher";

import type { ISaleArticleComment } from "./../../../../../structures/ISaleArticleComment";

/**
 * Store a new comment.
 *
 * Write a comment on a sale article. If you configure the comment to be
 * `anonymous`, only administrator, you and seller of the sale can read
 * the content.
 *
 * @param connection connection Information of the remote HTTP(s) server with headers (+encryption password)
 * @param request Instance of the Express.Request
 * @param sectionCode Code of the target section
 * @param saleId ID of the target sale
 * @param articleId ID of the target article
 * @param body Content to write
 * @return Newly archived comment
 * @throw 400 bad request error when type of the input data is not valid
 * @throw 401 unauthorized error when you've not logged in yet
 * @throw 403 forbidden error when you're a seller and the sale is not yours
 * @throw 404 not found error when unable to find the matched record
 *
 * @controller ConsumerSaleArticleCommentsController.store()
 * @path POST /consumers/:section/sales/:saleId/articles/:articleId/comments
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
export function store(
    connection: IConnection,
    sectionCode: string,
    saleId: string,
    articleId: string,
    body: Primitive<store.Input>,
): Promise<store.Output> {
    return Fetcher.fetch(
        connection,
        store.ENCRYPTED,
        store.METHOD,
        store.path(sectionCode, saleId, articleId),
        body,
    );
}
export namespace store {
    export type Input = Primitive<ISaleArticleComment.IStore>;
    export type Output = Primitive<ISaleArticleComment>;

    export const METHOD = "POST" as const;
    export const PATH: string =
        "/consumers/:section/sales/:saleId/articles/:articleId/comments";
    export const ENCRYPTED: Fetcher.IEncrypted = {
        request: false,
        response: false,
    };

    export function path(
        sectionCode: string,
        saleId: string,
        articleId: string,
    ): string {
        return `/consumers/${sectionCode}/sales/${saleId}/articles/${articleId}/comments`;
    }
}
```




#### Swagger

Building `Swagger` is also possible and even much powerful.

Looking at [simple/swagger.json](https://editor.swagger.io/?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsamchon%2Fnestia%2Fmaster%2Fdemo%2Fsimple%2Fswagger.json) file generated by `nestia`, everything is perfect. 

Route method, path and parameters are well-formed. Also, schema definitions are exactly matched with the pure interface type `ISaleArticleComment` and descritive comments are perfectly resurrected.

```json
{
  "components": 
  {
    "schemas": {
      "ISaleArticleComment.IStore": {
        "type": "object",
        "properties": {
          "body": {
            "type": "string",
            "nullable": false,
            "description": "Body of the content."
          },
          "extension": {
            "type": "string",
            "enum": ["html", "md", "txt"],
            "nullable": false,
            "description": "Extension, content type (format)."
          },
          "annonymous": {
            "type": "boolean",
            "nullable": true,
            "description": "Whether to hide the writer name or not."
          }
        },
        "nullable": false,
        "required": ["body", "extension"],
        "description": "Store info."
      }
    }
  }
}
```