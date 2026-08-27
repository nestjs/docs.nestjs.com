import{a as D}from"./chunk-HWO3INMO.js";import{a as A,b as T}from"./chunk-AO7BAPTM.js";import{G as u,L as s,Ma as x,N as m,Qa as p,Ra as c,Sa as h,V as n,W as t,X as a,Y as v,Z as b,_ as C,ja as g,la as e,na as S,oa as w,pa as I,ua as E,va as y,y as d}from"./chunk-IPH2CUBH.js";var L=(()=>{class i extends p{static \u0275fac=(()=>{let r;return function(l){return(r||(r=d(i)))(l||i)}})();static \u0275cmp=s({type:i,selectors:[["app-cli-plugin"]],features:[m],decls:282,vars:8,consts:[["contentReference",""],["app0d9286048852b2f57bafe169790558ea5cb169c8",""],["app551c944a9800a42f29db6dbf4c1a440b175d0ee5",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/graphql/cli-plugin.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","cli-plugin"],[1,"warning"],[1,"info"],["appAnchor","","id","overview"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],["appAnchor","","id","comments-introspection"],["appAnchor","","id","using-the-cli-plugin"],["routerLink","/cli/overview"],[1,"language-javascript"],["appAnchor","","id","swc-builder"],["href","/recipes/swc#type-checking"],[1,"language-bash"],["href","/recipes/swc#monorepo-and-cli-plugins"],["appAnchor","","id","integration-with-ts-jest-e2e-tests"],[1,"language-json"]],template:function(o,l){if(o&1&&(n(0,"div",3,0)(2,"div",4)(3,"a",5),a(4,"i",6),t()(),n(5,"h3",7),e(6,"CLI Plugin"),t(),n(7,"blockquote",8)(8,"strong"),e(9,"Warning"),t(),e(10,` This chapter applies only to the code first approach.
`),t(),n(11,"p"),e(12,"TypeScript's metadata reflection system has several limitations which make it impossible to, for instance, determine what properties a class consists of or recognize whether a given property is optional or required. However, some of these constraints can be addressed at compilation time. Nest provides a plugin that enhances the TypeScript compilation process to reduce the amount of boilerplate code required."),t(),n(13,"blockquote",9)(14,"strong"),e(15,"Hint"),t(),e(16," This plugin is "),n(17,"strong"),e(18,"opt-in"),t(),e(19,`. If you prefer, you can declare all decorators manually, or only specific decorators where you need them.
`),t(),n(20,"h4",10)(21,"span"),e(22,"Overview"),t()(),n(23,"p"),e(24,"The GraphQL plugin will automatically:"),t(),n(25,"ul")(26,"li"),e(27,"annotate all input object, object type and args classes properties with "),n(28,"code"),e(29,"@Field"),t(),e(30," unless "),n(31,"code"),e(32,"@HideField"),t(),e(33," is used"),t(),n(34,"li"),e(35,"set the "),n(36,"code"),e(37,"nullable"),t(),e(38," property depending on the question mark (e.g. "),n(39,"code"),e(40,"name?: string"),t(),e(41," will set "),n(42,"code"),e(43,"nullable: true"),t(),e(44,")"),t(),n(45,"li"),e(46,"set the "),n(47,"code"),e(48,"type"),t(),e(49," property depending on the type (supports arrays as well)"),t(),n(50,"li"),e(51,"generate descriptions for properties based on comments (if "),n(52,"code"),e(53,"introspectComments"),t(),e(54," set to "),n(55,"code"),e(56,"true"),t(),e(57,")"),t()(),n(58,"p"),e(59,"Please, note that your filenames "),n(60,"strong"),e(61,"must have"),t(),e(62," one of the following suffixes in order to be analyzed by the plugin: "),n(63,"code"),e(64,"['.input.ts', '.args.ts', '.entity.ts', '.model.ts']"),t(),e(65," (e.g., "),n(66,"code"),e(67,"author.entity.ts"),t(),e(68,"). If you are using a different suffix, you can adjust the plugin's behavior by specifying the "),n(69,"code"),e(70,"typeFileNameSuffix"),t(),e(71," option (see below)."),t(),n(72,"p"),e(73,"With what we've learned so far, you have to duplicate a lot of code to let the package know how your type should be declared in GraphQL. For example, you could define a simple "),n(74,"code"),e(75,"Author"),t(),e(76," class as follows:"),t(),n(77,"app-copy-button",11)(78,"span",12),e(79),E(80,"extension"),a(81,"app-tabs",null,1),t(),n(83,"pre")(84,"code",13),e(85,`
@ObjectType()
export class Author {
  @Field(type => ID)
  id: number;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field(type => [Post])
  posts: Post[];
}
`),t()()(),n(86,"p"),e(87,"While not a significant issue with medium-sized projects, it becomes verbose & hard to maintain once you have a large set of classes."),t(),n(88,"p"),e(89,"By enabling the GraphQL plugin, the above class definition can be declared simply:"),t(),n(90,"app-copy-button",11)(91,"span",12),e(92),E(93,"extension"),a(94,"app-tabs",null,2),t(),n(96,"pre")(97,"code",13),e(98,`
@ObjectType()
export class Author {
  @Field(type => ID)
  id: number;
  firstName?: string;
  lastName?: string;
  posts: Post[];
}
`),t()()(),n(99,"p"),e(100,"The plugin adds appropriate decorators on-the-fly based on the "),n(101,"strong"),e(102,"Abstract Syntax Tree"),t(),e(103,". Thus, you won't have to struggle with "),n(104,"code"),e(105,"@Field"),t(),e(106," decorators scattered throughout the code."),t(),n(107,"blockquote",9)(108,"strong"),e(109,"Hint"),t(),e(110," The plugin will automatically generate any missing GraphQL properties, but if you need to override them, simply set them explicitly via "),n(111,"code"),e(112,"@Field()"),t(),e(113,`.
`),t(),n(114,"h4",14)(115,"span"),e(116,"Comments introspection"),t()(),n(117,"p"),e(118,"With the comments introspection feature enabled, CLI plugin will generate descriptions for fields based on comments."),t(),n(119,"p"),e(120,"For example, given an example "),n(121,"code"),e(122,"roles"),t(),e(123," property:"),t(),n(124,"app-copy-button")(125,"pre")(126,"code",13),e(127,`
/**
 * A list of user's roles
 */
@Field(() => [String], {
  description: \`A list of user's roles\`
})
roles: string[];
`),t()()(),n(128,"p"),e(129,"You must duplicate description values. With "),n(130,"code"),e(131,"introspectComments"),t(),e(132," enabled, the CLI plugin can extract these comments and automatically provide descriptions for properties. Now, the above field can be declared simply as follows:"),t(),n(133,"app-copy-button")(134,"pre")(135,"code",13),e(136,`
/**
 * A list of user's roles
 */
roles: string[];
`),t()()(),n(137,"h4",15)(138,"span"),e(139,"Using the CLI plugin"),t()(),n(140,"p"),e(141,"To enable the plugin, open "),n(142,"code"),e(143,"nest-cli.json"),t(),e(144," (if you use "),n(145,"a",16),e(146,"Nest CLI"),t(),e(147,") and add the following "),n(148,"code"),e(149,"plugins"),t(),e(150," configuration:"),t(),n(151,"pre")(152,"code",17),e(153,`
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "plugins": ["@nestjs/graphql"]
  }
}
`),t()(),n(154,"p"),e(155,"You can use the "),n(156,"code"),e(157,"options"),t(),e(158," property to customize the behavior of the plugin."),t(),n(159,"pre")(160,"code",17),e(161,`
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "plugins": [
      {
        "name": "@nestjs/graphql",
        "options": {
          "typeFileNameSuffix": [".input.ts", ".args.ts"],
          "introspectComments": true
        }
      }
    ]
  }
}
`),t()(),n(162,"p"),e(163,"The "),n(164,"code"),e(165,"options"),t(),e(166," property has to fulfill the following interface:"),t(),n(167,"app-copy-button")(168,"pre")(169,"code",13),e(170,`
export interface PluginOptions {
  typeFileNameSuffix?: string[];
  introspectComments?: boolean;
}
`),t()()(),n(171,"table")(172,"tr")(173,"th"),e(174,"Option"),t(),n(175,"th"),e(176,"Default"),t(),n(177,"th"),e(178,"Description"),t()(),n(179,"tr")(180,"td")(181,"code"),e(182,"typeFileNameSuffix"),t()(),n(183,"td")(184,"code"),e(185,"['.input.ts', '.args.ts', '.entity.ts', '.model.ts']"),t()(),n(186,"td"),e(187,"GraphQL types files suffix"),t()(),n(188,"tr")(189,"td")(190,"code"),e(191,"introspectComments"),t()(),n(192,"td")(193,"code"),e(194,"false"),t()(),n(195,"td"),e(196,"If set to true, plugin will generate descriptions for properties based on comments"),t()()(),n(197,"p"),e(198,"If you don't use the CLI but instead have a custom "),n(199,"code"),e(200,"webpack"),t(),e(201," configuration, you can use this plugin in combination with "),n(202,"code"),e(203,"ts-loader"),t(),e(204,":"),t(),n(205,"pre")(206,"code",17),e(207,`
getCustomTransformers: (program: any) => ({
  before: [require('@nestjs/graphql/plugin').before({}, program)]
}),
`),t()(),n(208,"h4",18)(209,"span"),e(210,"SWC builder"),t()(),n(211,"p"),e(212,"For standard setups (non-monorepo), to use CLI Plugins with the SWC builder, you need to enable type checking, as described "),n(213,"a",19),e(214,"here"),t(),e(215,"."),t(),n(216,"pre")(217,"code",20),e(218,`
$ nest start -b swc --type-check
`),t()(),n(219,"p"),e(220,"For monorepo setups, follow the instructions "),n(221,"a",21),e(222,"here"),t(),e(223,"."),t(),n(224,"pre")(225,"code",20),e(226,`
$ npx ts-node src/generate-metadata.ts
# OR npx ts-node apps/{YOUR_APP}/src/generate-metadata.ts
`),t()(),n(227,"p"),e(228,"Now, the serialized metadata file must be loaded by the "),n(229,"code"),e(230,"GraphQLModule"),t(),e(231," method, as shown below:"),t(),n(232,"app-copy-button")(233,"pre")(234,"code",13),e(235,`
import metadata from './metadata'; // <-- file auto-generated by the "PluginMetadataGenerator"

GraphQLModule.forRoot<...>({
  ..., // other options
  metadata,
}),
`),t()()(),n(236,"h4",22)(237,"span"),e(238,"Integration with "),n(239,"code"),e(240,"ts-jest"),t(),e(241," (e2e tests)"),t()(),n(242,"p"),e(243,"When running e2e tests with this plugin enabled, you may run into issues with compiling schema. For example, one of the most common errors is:"),t(),n(244,"pre")(245,"code",23),e(246,`
Object type <name> must define one or more fields.
`),t()(),n(247,"p"),e(248,"This happens because "),n(249,"code"),e(250,"jest"),t(),e(251," configuration does not import "),n(252,"code"),e(253,"@nestjs/graphql/plugin"),t(),e(254," plugin anywhere."),t(),n(255,"p"),e(256,"To fix this, create the following file in your e2e tests directory:"),t(),n(257,"pre")(258,"code",17),e(259,`
const transformer = require('@nestjs/graphql/plugin');

module.exports.name = 'nestjs-graphql-transformer';
// you should change the version number anytime you change the configuration below - otherwise, jest will not detect changes
module.exports.version = 1;

module.exports.factory = (cs) => {
  return transformer.before(
    {
      // @nestjs/graphql/plugin options (can be empty)
    },
    cs.program, // "cs.tsCompiler.program" for older versions of Jest (<= v27)
  );
};
`),t()(),n(260,"p"),e(261,"With this in place, import AST transformer within your "),n(262,"code"),e(263,"jest"),t(),e(264," configuration file. By default (in the starter application), e2e tests configuration file is located under the "),n(265,"code"),e(266,"test"),t(),e(267," folder and is named "),n(268,"code"),e(269,"jest-e2e.json"),t(),e(270,"."),t(),n(271,"pre")(272,"code",23),e(273,`
{
  ... // other configuration
  "globals": {
    "ts-jest": {
      "astTransformers": {
        "before": ["<path to the file created above>"]
      }
    }
  }
}
`),t()(),n(274,"p"),e(275,"If you use "),n(276,"code"),e(277,"jest@^29"),t(),e(278,", then use the snippet below, as the previous approach got deprecated."),t(),n(279,"pre")(280,"code",23),e(281,`
{
  ... // other configuration
  "transform": {
    "^.+\\\\.(t|j)s$": [
      "ts-jest",
      {
        "astTransformers": {
          "before": ["<path to the file created above>"]
        }
      }
    ]
  }
}
`),t()()()),o&2){let q=g(82),k=g(95);u(79),S(" ",y(80,2,"authors/models/author.model",q.isJsActive),`
`),u(13),S(" ",y(93,5,"authors/models/author.model",k.isJsActive),`
`)}},dependencies:[c,h,A,x,T],encapsulation:2,changeDetection:0})}return i})();var F=(()=>{class i extends p{static \u0275fac=(()=>{let r;return function(l){return(r||(r=d(i)))(l||i)}})();static \u0275cmp=s({type:i,selectors:[["app-complexity"]],features:[m],decls:110,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/graphql/complexity.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","complexity"],[1,"warning"],["rel","nofollow","target","_blank","href","https://github.com/slicknode/graphql-query-complexity"],["appAnchor","","id","installation"],[1,"language-bash"],["appAnchor","","id","getting-started"],[1,"language-typescript"],[1,"info"],["appAnchor","","id","field-level-complexity"],["appAnchor","","id","querymutation-level-complexity"]],template:function(o,l){o&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),a(4,"i",4),t()(),n(5,"h3",5),e(6,"Complexity"),t(),n(7,"blockquote",6)(8,"strong"),e(9,"Warning"),t(),e(10,` This chapter applies only to the code first approach.
`),t(),n(11,"p"),e(12,"Query complexity allows you to define how complex certain fields are, and to restrict queries with a "),n(13,"strong"),e(14,"maximum complexity"),t(),e(15,". The idea is to define how complex each field is by using a simple number. A common default is to give each field a complexity of "),n(16,"code"),e(17,"1"),t(),e(18,". In addition, the complexity calculation of a GraphQL query can be customized with so-called complexity estimators. A complexity estimator is a simple function that calculates the complexity for a field. You can add any number of complexity estimators to the rule, which are then executed one after another. The first estimator that returns a numeric complexity value determines the complexity for that field."),t(),n(19,"p"),e(20,"The "),n(21,"code"),e(22,"@nestjs/graphql"),t(),e(23," package integrates very well with tools like "),n(24,"a",7),e(25,"graphql-query-complexity"),t(),e(26," that provides a cost analysis-based solution. With this library, you can reject queries to your GraphQL server that are deemed too costly to execute."),t(),n(27,"h4",8)(28,"span"),e(29,"Installation"),t()(),n(30,"p"),e(31,"To begin using it, we first install the required dependency."),t(),n(32,"pre")(33,"code",9),e(34,`
$ npm install --save graphql-query-complexity
`),t()(),n(35,"h4",10)(36,"span"),e(37,"Getting started"),t()(),n(38,"p"),e(39,"Once the installation process is complete, we can define the "),n(40,"code"),e(41,"ComplexityPlugin"),t(),e(42," class:"),t(),n(43,"app-copy-button")(44,"pre")(45,"code",11),e(46,`
import { GraphQLSchemaHost } from '@nestjs/graphql';
import { Plugin } from '@nestjs/apollo';
import {
  ApolloServerPlugin,
  BaseContext,
  GraphQLRequestListener,
} from '@apollo/server';
import { GraphQLError } from 'graphql';
import {
  fieldExtensionsEstimator,
  getComplexity,
  simpleEstimator,
} from 'graphql-query-complexity';

@Plugin()
export class ComplexityPlugin implements ApolloServerPlugin {
  constructor(private gqlSchemaHost: GraphQLSchemaHost) {}

  async requestDidStart(): Promise<GraphQLRequestListener<BaseContext>> {
    const maxComplexity = 20;
    const { schema } = this.gqlSchemaHost;

    return {
      async didResolveOperation({ request, document }) {
        const complexity = getComplexity({
          schema,
          operationName: request.operationName,
          query: document,
          variables: request.variables,
          estimators: [
            fieldExtensionsEstimator(),
            simpleEstimator({ defaultComplexity: 1 }),
          ],
        });
        if (complexity > maxComplexity) {
          throw new GraphQLError(
            \`Query is too complex: \${complexity}. Maximum allowed complexity: \${maxComplexity}\`,
          );
        }
        console.log('Query Complexity:', complexity);
      },
    };
  }
}
`),t()()(),n(47,"p"),e(48,"For demonstration purposes, we specified the maximum allowed complexity as "),n(49,"code"),e(50,"20"),t(),e(51,". In the example above, we used 2 estimators, the "),n(52,"code"),e(53,"simpleEstimator"),t(),e(54," and the "),n(55,"code"),e(56,"fieldExtensionsEstimator"),t(),e(57,"."),t(),n(58,"ul")(59,"li")(60,"code"),e(61,"simpleEstimator"),t(),e(62,": the simple estimator returns a fixed complexity for each field"),t(),n(63,"li")(64,"code"),e(65,"fieldExtensionsEstimator"),t(),e(66,": the field extensions estimator extracts the complexity value for each field of your schema"),t()(),n(67,"blockquote",12)(68,"strong"),e(69,"Hint"),t(),e(70,` Remember to add this class to the providers array in any module.
`),t(),n(71,"h4",13)(72,"span"),e(73,"Field-level complexity"),t()(),n(74,"p"),e(75,"With this plugin in place, we can now define the complexity for any field by specifying the "),n(76,"code"),e(77,"complexity"),t(),e(78," property in the options object passed into the "),n(79,"code"),e(80,"@Field()"),t(),e(81," decorator, as follows:"),t(),n(82,"app-copy-button")(83,"pre")(84,"code",11),e(85,`
@Field({ complexity: 3 })
title: string;
`),t()()(),n(86,"p"),e(87,"Alternatively, you can define the estimator function:"),t(),n(88,"app-copy-button")(89,"pre")(90,"code",11),e(91,`
@Field({ complexity: (options: ComplexityEstimatorArgs) => ... })
title: string;
`),t()()(),n(92,"h4",14)(93,"span"),e(94,"Query/Mutation-level complexity"),t()(),n(95,"p"),e(96,"In addition, "),n(97,"code"),e(98,"@Query()"),t(),e(99," and "),n(100,"code"),e(101,"@Mutation()"),t(),e(102," decorators may have a "),n(103,"code"),e(104,"complexity"),t(),e(105," property specified like so:"),t(),n(106,"app-copy-button")(107,"pre")(108,"code",11),e(109,`
@Query({ complexity: (options: ComplexityEstimatorArgs) => options.args.count * options.childComplexity })
items(@Args('count') count: number) {
  return this.itemsService.getItems({ count });
}
`),t()()()())},dependencies:[c,h],encapsulation:2,changeDetection:0})}return i})();var R=(()=>{class i extends p{static \u0275fac=(()=>{let r;return function(l){return(r||(r=d(i)))(l||i)}})();static \u0275cmp=s({type:i,selectors:[["app-directives"]],features:[m],decls:127,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/graphql/directives.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","directives"],["rel","nofollow","target","_blank","href","https://graphql.org/learn/queries/#directives"],["appAnchor","","id","custom-directives"],[1,"language-typescript"],["appAnchor","","id","code-first"],[1,"info"],[1,"warn"],["appAnchor","","id","schema-first"],[1,"language-graphql"]],template:function(o,l){o&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),a(4,"i",4),t()(),n(5,"h3",5),e(6,"Directives"),t(),n(7,"p"),e(8,"A directive can be attached to a field or fragment inclusion, and can affect execution of the query in any way the server desires (read more "),n(9,"a",6),e(10,"here"),t(),e(11,"). The GraphQL specification provides several default directives:"),t(),n(12,"ul")(13,"li")(14,"code"),e(15,"@include(if: Boolean)"),t(),e(16," - only include this field in the result if the argument is true"),t(),n(17,"li")(18,"code"),e(19,"@skip(if: Boolean)"),t(),e(20," - skip this field if the argument is true"),t(),n(21,"li")(22,"code"),e(23,"@deprecated(reason: String)"),t(),e(24," - marks field as deprecated with message"),t()(),n(25,"p"),e(26,"A directive is an identifier preceded by a "),n(27,"code"),e(28,"@"),t(),e(29," character, optionally followed by a list of named arguments, which can appear after almost any element in the GraphQL query and schema languages."),t(),n(30,"h4",7)(31,"span"),e(32,"Custom directives"),t()(),n(33,"p"),e(34,"To instruct what should happen when Apollo/Mercurius encounters your directive, you can create a transformer function. This function uses the "),n(35,"code"),e(36,"mapSchema"),t(),e(37," function to iterate through locations in your schema (field definitions, type definitions, etc.) and perform corresponding transformations."),t(),n(38,"app-copy-button")(39,"pre")(40,"code",8),e(41,`
import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils';
import { defaultFieldResolver, GraphQLSchema } from 'graphql';

export function upperDirectiveTransformer(
  schema: GraphQLSchema,
  directiveName: string,
) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const upperDirective = getDirective(
        schema,
        fieldConfig,
        directiveName,
      )?.[0];

      if (upperDirective) {
        const { resolve = defaultFieldResolver } = fieldConfig;

        // Replace the original resolver with a function that *first* calls
        // the original resolver, then converts its result to upper case
        fieldConfig.resolve = async function (source, args, context, info) {
          const result = await resolve(source, args, context, info);
          if (typeof result === 'string') {
            return result.toUpperCase();
          }
          return result;
        };
        return fieldConfig;
      }
    },
  });
}
`),t()()(),n(42,"p"),e(43,"Now, apply the "),n(44,"code"),e(45,"upperDirectiveTransformer"),t(),e(46," transformation function in the "),n(47,"code"),e(48,"GraphQLModule#forRoot"),t(),e(49," method using the "),n(50,"code"),e(51,"transformSchema"),t(),e(52," function:"),t(),n(53,"app-copy-button")(54,"pre")(55,"code",8),e(56,`
GraphQLModule.forRoot({
  // ...
  transformSchema: (schema) => upperDirectiveTransformer(schema, 'upper'),
});
`),t()()(),n(57,"p"),e(58,"Once registered, the "),n(59,"code"),e(60,"@upper"),t(),e(61," directive can be used in our schema. However, the way you apply the directive will vary depending on the approach you use (code first or schema first)."),t(),n(62,"h4",9)(63,"span"),e(64,"Code first"),t()(),n(65,"p"),e(66,"In the code first approach, use the "),n(67,"code"),e(68,"@Directive()"),t(),e(69," decorator to apply the directive."),t(),n(70,"app-copy-button")(71,"pre")(72,"code",8),e(73,`
@Directive('@upper')
@Field()
title: string;
`),t()()(),n(74,"blockquote",10)(75,"strong"),e(76,"Hint"),t(),e(77," The "),n(78,"code"),e(79,"@Directive()"),t(),e(80," decorator is exported from the "),n(81,"code"),e(82,"@nestjs/graphql"),t(),e(83,` package.
`),t(),n(84,"p"),e(85,"Directives can be applied on fields, field resolvers, input and object types, as well as queries, mutations, and subscriptions. Here's an example of the directive applied on the query handler level:"),t(),n(86,"app-copy-button")(87,"pre")(88,"code",8),e(89,`
@Directive('@deprecated(reason: "This query will be removed in the next version")')
@Query(() => Author, { name: 'author' })
async getAuthor(@Args({ name: 'id', type: () => Int }) id: number) {
  return this.authorsService.findOneById(id);
}
`),t()()(),n(90,"blockquote",11)(91,"strong"),e(92,"Warning"),t(),e(93," Directives applied through the "),n(94,"code"),e(95,"@Directive()"),t(),e(96,` decorator will not be reflected in the generated schema definition file.
`),t(),n(97,"p"),e(98,"Lastly, make sure to declare directives in the "),n(99,"code"),e(100,"GraphQLModule"),t(),e(101,", as follows:"),t(),n(102,"app-copy-button")(103,"pre")(104,"code",8),e(105,`
GraphQLModule.forRoot({
  // ...,
  transformSchema: schema => upperDirectiveTransformer(schema, 'upper'),
  buildSchemaOptions: {
    directives: [
      new GraphQLDirective({
        name: 'upper',
        locations: [DirectiveLocation.FIELD_DEFINITION],
      }),
    ],
  },
}),
`),t()()(),n(106,"blockquote",10)(107,"strong"),e(108,"Hint"),t(),e(109," Both "),n(110,"code"),e(111,"GraphQLDirective"),t(),e(112," and "),n(113,"code"),e(114,"DirectiveLocation"),t(),e(115," are exported from the "),n(116,"code"),e(117,"graphql"),t(),e(118,` package.
`),t(),n(119,"h4",12)(120,"span"),e(121,"Schema first"),t()(),n(122,"p"),e(123,"In the schema first approach, apply directives directly in SDL."),t(),n(124,"pre")(125,"code",13),e(126,`
directive @upper on FIELD_DEFINITION

type Post {
  id: Int!
  title: String! @upper
  votes: Int
}
`),t()()())},dependencies:[c,h],encapsulation:2,changeDetection:0})}return i})();var j=(()=>{class i extends p{static \u0275fac=(()=>{let r;return function(l){return(r||(r=d(i)))(l||i)}})();static \u0275cmp=s({type:i,selectors:[["app-extensions"]],features:[m],decls:73,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/graphql/extensions.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","extensions"],[1,"warning"],["appAnchor","","id","adding-custom-metadata"],[1,"language-typescript"],["appAnchor","","id","using-custom-metadata"],["routerLink","/graphql/field-middleware"]],template:function(o,l){o&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),a(4,"i",4),t()(),n(5,"h3",5),e(6,"Extensions"),t(),n(7,"blockquote",6)(8,"strong"),e(9,"Warning"),t(),e(10,` This chapter applies only to the code first approach.
`),t(),n(11,"p"),e(12,"Extensions is an "),n(13,"strong"),e(14,"advanced, low-level feature"),t(),e(15," that lets you define arbitrary data in the types configuration. Attaching custom metadata to certain fields allows you to create more sophisticated, generic solutions. For example, with extensions, you can define field-level roles required to access particular fields. Such roles can be reflected at runtime to determine whether the caller has sufficient permissions to retrieve a specific field."),t(),n(16,"h4",7)(17,"span"),e(18,"Adding custom metadata"),t()(),n(19,"p"),e(20,"To attach custom metadata for a field, use the "),n(21,"code"),e(22,"@Extensions()"),t(),e(23," decorator exported from the "),n(24,"code"),e(25,"@nestjs/graphql"),t(),e(26," package."),t(),n(27,"app-copy-button")(28,"pre")(29,"code",8),e(30,`
@Field()
@Extensions({ role: Role.ADMIN })
password: string;
`),t()()(),n(31,"p"),e(32,"In the example above, we assigned the "),n(33,"code"),e(34,"role"),t(),e(35," metadata property the value of "),n(36,"code"),e(37,"Role.ADMIN"),t(),e(38,". "),n(39,"code"),e(40,"Role"),t(),e(41," is a simple TypeScript enum that groups all the user roles available in our system."),t(),n(42,"p"),e(43,"Note, in addition to setting metadata on fields, you can use the "),n(44,"code"),e(45,"@Extensions()"),t(),e(46," decorator at the class level and method level (e.g., on the query handler)."),t(),n(47,"h4",9)(48,"span"),e(49,"Using custom metadata"),t()(),n(50,"p"),e(51,"Logic that leverages the custom metadata can be as complex as needed. For example, you can create a simple interceptor that stores/logs events per method invocation, or a "),n(52,"a",10),e(53,"field middleware"),t(),e(54," that matches roles required to retrieve a field with the caller permissions (field-level permissions system)."),t(),n(55,"p"),e(56,"For illustration purposes, let's define a "),n(57,"code"),e(58,"checkRoleMiddleware"),t(),e(59," that compares a user's role (hardcoded here) with a role required to access a target field:"),t(),n(60,"app-copy-button")(61,"pre")(62,"code",8),e(63,`
export const checkRoleMiddleware: FieldMiddleware = async (
  ctx: MiddlewareContext,
  next: NextFn,
) => {
  const { info } = ctx;
  const { extensions } = info.parentType.getFields()[info.fieldName];

  /**
   * In a real-world application, the "userRole" variable
   * should represent the caller's (user) role (for example, "ctx.user.role").
   */
  const userRole = Role.USER;
  if (userRole === extensions.role) {
    // or just "return null" to ignore
    throw new ForbiddenException(
      \`User does not have sufficient permissions to access "\${info.fieldName}" field.\`,
    );
  }
  return next();
};
`),t()()(),n(64,"p"),e(65,"With this in place, we can register a middleware for the "),n(66,"code"),e(67,"password"),t(),e(68," field, as follows:"),t(),n(69,"app-copy-button")(70,"pre")(71,"code",8),e(72,`
@Field({ middleware: [checkRoleMiddleware] })
@Extensions({ role: Role.ADMIN })
password: string;
`),t()()()())},dependencies:[c,h,x],encapsulation:2,changeDetection:0})}return i})();var P=(()=>{class i extends p{static \u0275fac=(()=>{let r;return function(l){return(r||(r=d(i)))(l||i)}})();static \u0275cmp=s({type:i,selectors:[["app-federation"]],features:[m],decls:639,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/graphql/federation.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","federation"],["rel","nofollow","target","_blank","href","https://blog.apollographql.com/apollo-federation-f260cf525d21"],[1,"warning"],["appAnchor","","id","federation-with-apollo"],[1,"language-bash"],["appAnchor","","id","schema-first"],[1,"language-graphql"],[1,"language-typescript"],["appAnchor","","id","code-first"],[1,"language-ts"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/31-graphql-federation-code-first/users-application"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/32-graphql-federation-schema-first/users-application"],["appAnchor","","id","federated-example-posts"],["appAnchor","","id","schema-first-1"],["appAnchor","","id","code-first-1"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/31-graphql-federation-code-first/posts-application"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/32-graphql-federation-schema-first/posts-application"],["appAnchor","","id","federated-example-gateway"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/31-graphql-federation-code-first/gateway"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/32-graphql-federation-schema-first/gateway"],["appAnchor","","id","federation-with-mercurius"],[1,"info"],["appAnchor","","id","schema-first-2"],["appAnchor","","id","code-first-2"],["appAnchor","","id","federated-example-posts-1"],["appAnchor","","id","schema-first-3"],["appAnchor","","id","code-first-3"],["appAnchor","","id","federated-example-gateway-1"],["id","federation-2"],["rel","nofollow","target","_blank","href","https://www.apollographql.com/docs/federation/federation-2/new-in-federation-2"],["rel","nofollow","target","_blank","href","https://www.apollographql.com/docs/federation/supported-subgraphs#javascript--typescript"],["appAnchor","","id","federated-example-users"],["rel","nofollow","target","_blank","href","https://www.apollographql.com/docs/federation/federation-2/new-in-federation-2#entities"],["appAnchor","","id","schema-first-4"],["appAnchor","","id","code-first-4"],["appAnchor","","id","federated-example-posts-2"],["appAnchor","","id","schema-first-5"],["appAnchor","","id","code-first-5"]],template:function(o,l){o&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),a(4,"i",4),t()(),n(5,"h3",5),e(6,"Federation"),t(),n(7,"p"),e(8,"Federation offers a means of splitting your monolithic GraphQL server into independent microservices. It consists of two components: a gateway and one or more federated microservices. Each microservice holds part of the schema and the gateway merges the schemas into a single schema that can be consumed by the client."),t(),n(9,"p"),e(10,"To quote the "),n(11,"a",6),e(12,"Apollo docs"),t(),e(13,", Federation is designed with these core principles:"),t(),n(14,"ul")(15,"li"),e(16,"Building a graph should be "),n(17,"strong"),e(18,"declarative."),t(),e(19," With federation, you compose a graph declaratively from within your schema instead of writing imperative schema stitching code."),t(),n(20,"li"),e(21,"Code should be separated by "),n(22,"strong"),e(23,"concern"),t(),e(24,", not by types. Often no single team controls every aspect of an important type like a User or Product, so the definition of these types should be distributed across teams and codebases, rather than centralized."),t(),n(25,"li"),e(26,"The graph should be simple for clients to consume. Together, federated services can form a complete, product-focused graph that accurately reflects how it\u2019s being consumed on the client."),t(),n(27,"li"),e(28,"It\u2019s just "),n(29,"strong"),e(30,"GraphQL"),t(),e(31,", using only spec-compliant features of the language. Any language, not just JavaScript, can implement federation."),t()(),n(32,"blockquote",7)(33,"strong"),e(34,"Warning"),t(),e(35,` Federation currently does not support subscriptions.
`),t(),n(36,"p"),e(37,"In the following sections, we'll set up a demo application that consists of a gateway and two federated endpoints: Users service and Posts service."),t(),n(38,"h4",8)(39,"span"),e(40,"Federation with Apollo"),t()(),n(41,"p"),e(42,"Start by installing the required dependencies:"),t(),n(43,"pre")(44,"code",9),e(45,`
$ npm install --save @apollo/subgraph
`),t()(),n(46,"h4",10)(47,"span"),e(48,"Schema first"),t()(),n(49,"p"),e(50,'The "User service" provides a simple schema. Note the '),n(51,"code"),e(52,"@key"),t(),e(53," directive: it instructs the Apollo query planner that a particular instance of "),n(54,"code"),e(55,"User"),t(),e(56," can be fetched if you specify its "),n(57,"code"),e(58,"id"),t(),e(59,". Also, note that we "),n(60,"code"),e(61,"extend"),t(),e(62," the "),n(63,"code"),e(64,"Query"),t(),e(65," type."),t(),n(66,"pre")(67,"code",11),e(68,`
type User @key(fields: "id") {
  id: ID!
  name: String!
}

extend type Query {
  getUser(id: ID!): User
}
`),t()(),n(69,"p"),e(70,"Resolver provides one additional method named "),n(71,"code"),e(72,"resolveReference()"),t(),e(73,". This method is triggered by the Apollo Gateway whenever a related resource requires a User instance. We'll see an example of this in the Posts service later. Please note that the method must be annotated with the "),n(74,"code"),e(75,"@ResolveReference()"),t(),e(76," decorator."),t(),n(77,"app-copy-button")(78,"pre")(79,"code",12),e(80,`
import { Args, Query, Resolver, ResolveReference } from '@nestjs/graphql';
import { UsersService } from './users.service';

@Resolver('User')
export class UsersResolver {
  constructor(private usersService: UsersService) {}

  @Query()
  getUser(@Args('id') id: string) {
    return this.usersService.findById(id);
  }

  @ResolveReference()
  resolveReference(reference: { __typename: string; id: string }) {
    return this.usersService.findById(reference.id);
  }
}
`),t()()(),n(81,"p"),e(82,"Finally, we hook everything up by registering the "),n(83,"code"),e(84,"GraphQLModule"),t(),e(85," passing the "),n(86,"code"),e(87,"ApolloFederationDriver"),t(),e(88," driver in the configuration object:"),t(),n(89,"app-copy-button")(90,"pre")(91,"code",12),e(92,`
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { UsersResolver } from './users.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      typePaths: ['**/*.graphql'],
    }),
  ],
  providers: [UsersResolver],
})
export class AppModule {}
`),t()()(),n(93,"h4",13)(94,"span"),e(95,"Code first"),t()(),n(96,"p"),e(97,"Start by adding some extra decorators to the "),n(98,"code"),e(99,"User"),t(),e(100," entity."),t(),n(101,"app-copy-button")(102,"pre")(103,"code",14),e(104,`
import { Directive, Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
@Directive('@key(fields: "id")')
export class User {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;
}
`),t()()(),n(105,"p"),e(106,"Resolver provides one additional method named "),n(107,"code"),e(108,"resolveReference()"),t(),e(109,". This method is triggered by the Apollo Gateway whenever a related resource requires a User instance. We'll see an example of this in the Posts service later. Please note that the method must be annotated with the "),n(110,"code"),e(111,"@ResolveReference()"),t(),e(112," decorator."),t(),n(113,"app-copy-button")(114,"pre")(115,"code",14),e(116,`
import { Args, Query, Resolver, ResolveReference } from '@nestjs/graphql';
import { User } from './user.entity';
import { UsersService } from './users.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(private usersService: UsersService) {}

  @Query(() => User)
  getUser(@Args('id') id: number): User {
    return this.usersService.findById(id);
  }

  @ResolveReference()
  resolveReference(reference: { __typename: string; id: number }): User {
    return this.usersService.findById(reference.id);
  }
}
`),t()()(),n(117,"p"),e(118,"Finally, we hook everything up by registering the "),n(119,"code"),e(120,"GraphQLModule"),t(),e(121," passing the "),n(122,"code"),e(123,"ApolloFederationDriver"),t(),e(124," driver in the configuration object:"),t(),n(125,"app-copy-button")(126,"pre")(127,"code",12),e(128,`
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service'; // Not included in this example

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: true,
    }),
  ],
  providers: [UsersResolver, UsersService],
})
export class AppModule {}
`),t()()(),n(129,"p"),e(130,"A working example is available "),n(131,"a",15),e(132,"here"),t(),e(133," in code first mode and "),n(134,"a",16),e(135,"here"),t(),e(136," in schema first mode."),t(),n(137,"h4",17)(138,"span"),e(139,"Federated example: Posts"),t()(),n(140,"p"),e(141,"Post service is supposed to serve aggregated posts through the "),n(142,"code"),e(143,"getPosts"),t(),e(144," query, but also extend our "),n(145,"code"),e(146,"User"),t(),e(147," type with the "),n(148,"code"),e(149,"user.posts"),t(),e(150," field."),t(),n(151,"h4",18)(152,"span"),e(153,"Schema first"),t()(),n(154,"p"),e(155,'"Posts service" references the '),n(156,"code"),e(157,"User"),t(),e(158," type in its schema by marking it with the "),n(159,"code"),e(160,"extend"),t(),e(161," keyword. It also declares one additional property on the "),n(162,"code"),e(163,"User"),t(),e(164," type ("),n(165,"code"),e(166,"posts"),t(),e(167,"). Note the "),n(168,"code"),e(169,"@key"),t(),e(170," directive used for matching instances of User, and the "),n(171,"code"),e(172,"@external"),t(),e(173," directive indicating that the "),n(174,"code"),e(175,"id"),t(),e(176," field is managed elsewhere."),t(),n(177,"pre")(178,"code",11),e(179,`
type Post @key(fields: "id") {
  id: ID!
  title: String!
  body: String!
  user: User
}

extend type User @key(fields: "id") {
  id: ID! @external
  posts: [Post]
}

extend type Query {
  getPosts: [Post]
}
`),t()(),n(180,"p"),e(181,"In the following example, the "),n(182,"code"),e(183,"PostsResolver"),t(),e(184," provides the "),n(185,"code"),e(186,"getUser()"),t(),e(187," method that returns a reference containing "),n(188,"code"),e(189,"__typename"),t(),e(190," and some additional properties your application may need to resolve the reference, in this case "),n(191,"code"),e(192,"id"),t(),e(193,". "),n(194,"code"),e(195,"__typename"),t(),e(196,' is used by the GraphQL Gateway to pinpoint the microservice responsible for the User type and retrieve the corresponding instance. The "Users service" described above will be requested upon execution of the '),n(197,"code"),e(198,"resolveReference()"),t(),e(199," method."),t(),n(200,"app-copy-button")(201,"pre")(202,"code",12),e(203,`
import { Query, Resolver, Parent, ResolveField } from '@nestjs/graphql';
import { PostsService } from './posts.service';
import { Post } from './posts.interfaces';

@Resolver('Post')
export class PostsResolver {
  constructor(private postsService: PostsService) {}

  @Query('getPosts')
  getPosts() {
    return this.postsService.findAll();
  }

  @ResolveField('user')
  getUser(@Parent() post: Post) {
    return { __typename: 'User', id: post.userId };
  }
}
`),t()()(),n(204,"p"),e(205,"Lastly, we must register the "),n(206,"code"),e(207,"GraphQLModule"),t(),e(208,', similarly to what we did in the "Users service" section.'),t(),n(209,"app-copy-button")(210,"pre")(211,"code",12),e(212,`
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { PostsResolver } from './posts.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      typePaths: ['**/*.graphql'],
    }),
  ],
  providers: [PostsResolver],
})
export class AppModule {}
`),t()()(),n(213,"h4",19)(214,"span"),e(215,"Code first"),t()(),n(216,"p"),e(217,"First, we will have to declare a class representing the "),n(218,"code"),e(219,"User"),t(),e(220," entity. Although the entity itself lives in another service, we will be using it (extending its definition) here. Note the "),n(221,"code"),e(222,"@extends"),t(),e(223," and "),n(224,"code"),e(225,"@external"),t(),e(226," directives."),t(),n(227,"app-copy-button")(228,"pre")(229,"code",14),e(230,`
import { Directive, ObjectType, Field, ID } from '@nestjs/graphql';
import { Post } from './post.entity';

@ObjectType()
@Directive('@extends')
@Directive('@key(fields: "id")')
export class User {
  @Field(() => ID)
  @Directive('@external')
  id: number;

  @Field(() => [Post])
  posts?: Post[];
}
`),t()()(),n(231,"p"),e(232,"Now let's create the corresponding resolver for our extension on the "),n(233,"code"),e(234,"User"),t(),e(235," entity, as follows:"),t(),n(236,"app-copy-button")(237,"pre")(238,"code",14),e(239,`
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PostsService } from './posts.service';
import { Post } from './post.entity';
import { User } from './user.entity';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly postsService: PostsService) {}

  @ResolveField(() => [Post])
  public posts(@Parent() user: User): Post[] {
    return this.postsService.forAuthor(user.id);
  }
}
`),t()()(),n(240,"p"),e(241,"We also have to define the "),n(242,"code"),e(243,"Post"),t(),e(244," entity class:"),t(),n(245,"app-copy-button")(246,"pre")(247,"code",14),e(248,`
import { Directive, Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { User } from './user.entity';

@ObjectType()
@Directive('@key(fields: "id")')
export class Post {
  @Field(() => ID)
  id: number;

  @Field()
  title: string;

  @Field(() => Int)
  authorId: number;

  @Field(() => User)
  user?: User;
}
`),t()()(),n(249,"p"),e(250,"And its resolver:"),t(),n(251,"app-copy-button")(252,"pre")(253,"code",14),e(254,`
import { Query, Args, ResolveField, Resolver, Parent } from '@nestjs/graphql';
import { PostsService } from './posts.service';
import { Post } from './post.entity';
import { User } from './user.entity';

@Resolver(() => Post)
export class PostsResolver {
  constructor(private readonly postsService: PostsService) {}

  @Query(() => Post)
  findPost(@Args('id') id: number): Post {
    return this.postsService.findOne(id);
  }

  @Query(() => [Post])
  getPosts(): Post[] {
    return this.postsService.all();
  }

  @ResolveField(() => User)
  user(@Parent() post: Post): any {
    return { __typename: 'User', id: post.authorId };
  }
}
`),t()()(),n(255,"p"),e(256,"And finally, tie it together in a module. Note the schema build options, where we specify that "),n(257,"code"),e(258,"User"),t(),e(259," is an orphaned (external) type."),t(),n(260,"app-copy-button")(261,"pre")(262,"code",14),e(263,`
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { User } from './user.entity';
import { PostsResolver } from './posts.resolvers';
import { UsersResolver } from './users.resolvers';
import { PostsService } from './posts.service'; // Not included in example

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: true,
      buildSchemaOptions: {
        orphanedTypes: [User],
      },
    }),
  ],
  providers: [PostsResolver, UsersResolver, PostsService],
})
export class AppModule {}
`),t()()(),n(264,"p"),e(265,"A working example is available "),n(266,"a",20),e(267,"here"),t(),e(268," for the code first mode and "),n(269,"a",21),e(270,"here"),t(),e(271," for the schema first mode."),t(),n(272,"h4",22)(273,"span"),e(274,"Federated example: Gateway"),t()(),n(275,"p"),e(276,"Start by installing the required dependency:"),t(),n(277,"pre")(278,"code",9),e(279,`
$ npm install --save @apollo/gateway
`),t()(),n(280,"p"),e(281,"The gateway requires a list of endpoints to be specified and it will auto-discover the corresponding schemas. Therefore the implementation of the gateway service will remain the same for both code and schema first approaches."),t(),n(282,"app-copy-button")(283,"pre")(284,"code",12),e(285,`
import { IntrospectAndCompose } from '@apollo/gateway';
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      server: {
        // ... Apollo server options
        cors: true,
      },
      gateway: {
        supergraphSdl: new IntrospectAndCompose({
          subgraphs: [
            { name: 'users', url: 'http://user-service/graphql' },
            { name: 'posts', url: 'http://post-service/graphql' },
          ],
        }),
      },
    }),
  ],
})
export class AppModule {}
`),t()()(),n(286,"p"),e(287,"A working example is available "),n(288,"a",23),e(289,"here"),t(),e(290," for the code first mode and "),n(291,"a",24),e(292,"here"),t(),e(293," for the schema first mode."),t(),n(294,"h4",25)(295,"span"),e(296,"Federation with Mercurius"),t()(),n(297,"p"),e(298,"Start by installing the required dependencies:"),t(),n(299,"pre")(300,"code",9),e(301,`
$ npm install --save @apollo/subgraph @nestjs/mercurius
`),t()(),n(302,"blockquote",26)(303,"strong"),e(304,"Note"),t(),e(305," The "),n(306,"code"),e(307,"@apollo/subgraph"),t(),e(308," package is required to build a subgraph schema ("),n(309,"code"),e(310,"buildSubgraphSchema"),t(),e(311,", "),n(312,"code"),e(313,"printSubgraphSchema"),t(),e(314,` functions).
`),t(),n(315,"h4",27)(316,"span"),e(317,"Schema first"),t()(),n(318,"p"),e(319,'The "User service" provides a simple schema. Note the '),n(320,"code"),e(321,"@key"),t(),e(322," directive: it instructs the Mercurius query planner that a particular instance of "),n(323,"code"),e(324,"User"),t(),e(325," can be fetched if you specify its "),n(326,"code"),e(327,"id"),t(),e(328,". Also, note that we "),n(329,"code"),e(330,"extend"),t(),e(331," the "),n(332,"code"),e(333,"Query"),t(),e(334," type."),t(),n(335,"pre")(336,"code",11),e(337,`
type User @key(fields: "id") {
  id: ID!
  name: String!
}

extend type Query {
  getUser(id: ID!): User
}
`),t()(),n(338,"p"),e(339,"Resolver provides one additional method named "),n(340,"code"),e(341,"resolveReference()"),t(),e(342,". This method is triggered by the Mercurius Gateway whenever a related resource requires a User instance. We'll see an example of this in the Posts service later. Please note that the method must be annotated with the "),n(343,"code"),e(344,"@ResolveReference()"),t(),e(345," decorator."),t(),n(346,"app-copy-button")(347,"pre")(348,"code",12),e(349,`
import { Args, Query, Resolver, ResolveReference } from '@nestjs/graphql';
import { UsersService } from './users.service';

@Resolver('User')
export class UsersResolver {
  constructor(private usersService: UsersService) {}

  @Query()
  getUser(@Args('id') id: string) {
    return this.usersService.findById(id);
  }

  @ResolveReference()
  resolveReference(reference: { __typename: string; id: string }) {
    return this.usersService.findById(reference.id);
  }
}
`),t()()(),n(350,"p"),e(351,"Finally, we hook everything up by registering the "),n(352,"code"),e(353,"GraphQLModule"),t(),e(354," passing the "),n(355,"code"),e(356,"MercuriusFederationDriver"),t(),e(357," driver in the configuration object:"),t(),n(358,"app-copy-button")(359,"pre")(360,"code",12),e(361,`
import {
  MercuriusFederationDriver,
  MercuriusFederationDriverConfig,
} from '@nestjs/mercurius';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { UsersResolver } from './users.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusFederationDriverConfig>({
      driver: MercuriusFederationDriver,
      typePaths: ['**/*.graphql'],
      federationMetadata: true,
    }),
  ],
  providers: [UsersResolver],
})
export class AppModule {}
`),t()()(),n(362,"h4",28)(363,"span"),e(364,"Code first"),t()(),n(365,"p"),e(366,"Start by adding some extra decorators to the "),n(367,"code"),e(368,"User"),t(),e(369," entity."),t(),n(370,"app-copy-button")(371,"pre")(372,"code",14),e(373,`
import { Directive, Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
@Directive('@key(fields: "id")')
export class User {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;
}
`),t()()(),n(374,"p"),e(375,"Resolver provides one additional method named "),n(376,"code"),e(377,"resolveReference()"),t(),e(378,". This method is triggered by the Mercurius Gateway whenever a related resource requires a User instance. We'll see an example of this in the Posts service later. Please note that the method must be annotated with the "),n(379,"code"),e(380,"@ResolveReference()"),t(),e(381," decorator."),t(),n(382,"app-copy-button")(383,"pre")(384,"code",14),e(385,`
import { Args, Query, Resolver, ResolveReference } from '@nestjs/graphql';
import { User } from './user.entity';
import { UsersService } from './users.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(private usersService: UsersService) {}

  @Query(() => User)
  getUser(@Args('id') id: number): User {
    return this.usersService.findById(id);
  }

  @ResolveReference()
  resolveReference(reference: { __typename: string; id: number }): User {
    return this.usersService.findById(reference.id);
  }
}
`),t()()(),n(386,"p"),e(387,"Finally, we hook everything up by registering the "),n(388,"code"),e(389,"GraphQLModule"),t(),e(390," passing the "),n(391,"code"),e(392,"MercuriusFederationDriver"),t(),e(393," driver in the configuration object:"),t(),n(394,"app-copy-button")(395,"pre")(396,"code",12),e(397,`
import {
  MercuriusFederationDriver,
  MercuriusFederationDriverConfig,
} from '@nestjs/mercurius';
import { Module } from '@nestjs/common';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service'; // Not included in this example

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusFederationDriverConfig>({
      driver: MercuriusFederationDriver,
      autoSchemaFile: true,
      federationMetadata: true,
    }),
  ],
  providers: [UsersResolver, UsersService],
})
export class AppModule {}
`),t()()(),n(398,"h4",29)(399,"span"),e(400,"Federated example: Posts"),t()(),n(401,"p"),e(402,"Post service is supposed to serve aggregated posts through the "),n(403,"code"),e(404,"getPosts"),t(),e(405," query, but also extend our "),n(406,"code"),e(407,"User"),t(),e(408," type with the "),n(409,"code"),e(410,"user.posts"),t(),e(411," field."),t(),n(412,"h4",30)(413,"span"),e(414,"Schema first"),t()(),n(415,"p"),e(416,'"Posts service" references the '),n(417,"code"),e(418,"User"),t(),e(419," type in its schema by marking it with the "),n(420,"code"),e(421,"extend"),t(),e(422," keyword. It also declares one additional property on the "),n(423,"code"),e(424,"User"),t(),e(425," type ("),n(426,"code"),e(427,"posts"),t(),e(428,"). Note the "),n(429,"code"),e(430,"@key"),t(),e(431," directive used for matching instances of User, and the "),n(432,"code"),e(433,"@external"),t(),e(434," directive indicating that the "),n(435,"code"),e(436,"id"),t(),e(437," field is managed elsewhere."),t(),n(438,"pre")(439,"code",11),e(440,`
type Post @key(fields: "id") {
  id: ID!
  title: String!
  body: String!
  user: User
}

extend type User @key(fields: "id") {
  id: ID! @external
  posts: [Post]
}

extend type Query {
  getPosts: [Post]
}
`),t()(),n(441,"p"),e(442,"In the following example, the "),n(443,"code"),e(444,"PostsResolver"),t(),e(445," provides the "),n(446,"code"),e(447,"getUser()"),t(),e(448," method that returns a reference containing "),n(449,"code"),e(450,"__typename"),t(),e(451," and some additional properties your application may need to resolve the reference, in this case "),n(452,"code"),e(453,"id"),t(),e(454,". "),n(455,"code"),e(456,"__typename"),t(),e(457,' is used by the GraphQL Gateway to pinpoint the microservice responsible for the User type and retrieve the corresponding instance. The "Users service" described above will be requested upon execution of the '),n(458,"code"),e(459,"resolveReference()"),t(),e(460," method."),t(),n(461,"app-copy-button")(462,"pre")(463,"code",12),e(464,`
import { Query, Resolver, Parent, ResolveField } from '@nestjs/graphql';
import { PostsService } from './posts.service';
import { Post } from './posts.interfaces';

@Resolver('Post')
export class PostsResolver {
  constructor(private postsService: PostsService) {}

  @Query('getPosts')
  getPosts() {
    return this.postsService.findAll();
  }

  @ResolveField('user')
  getUser(@Parent() post: Post) {
    return { __typename: 'User', id: post.userId };
  }
}
`),t()()(),n(465,"p"),e(466,"Lastly, we must register the "),n(467,"code"),e(468,"GraphQLModule"),t(),e(469,', similarly to what we did in the "Users service" section.'),t(),n(470,"app-copy-button")(471,"pre")(472,"code",12),e(473,`
import {
  MercuriusFederationDriver,
  MercuriusFederationDriverConfig,
} from '@nestjs/mercurius';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { PostsResolver } from './posts.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusFederationDriverConfig>({
      driver: MercuriusFederationDriver,
      federationMetadata: true,
      typePaths: ['**/*.graphql'],
    }),
  ],
  providers: [PostsResolver],
})
export class AppModule {}
`),t()()(),n(474,"h4",31)(475,"span"),e(476,"Code first"),t()(),n(477,"p"),e(478,"First, we will have to declare a class representing the "),n(479,"code"),e(480,"User"),t(),e(481," entity. Although the entity itself lives in another service, we will be using it (extending its definition) here. Note the "),n(482,"code"),e(483,"@extends"),t(),e(484," and "),n(485,"code"),e(486,"@external"),t(),e(487," directives."),t(),n(488,"app-copy-button")(489,"pre")(490,"code",14),e(491,`
import { Directive, ObjectType, Field, ID } from '@nestjs/graphql';
import { Post } from './post.entity';

@ObjectType()
@Directive('@extends')
@Directive('@key(fields: "id")')
export class User {
  @Field(() => ID)
  @Directive('@external')
  id: number;

  @Field(() => [Post])
  posts?: Post[];
}
`),t()()(),n(492,"p"),e(493,"Now let's create the corresponding resolver for our extension on the "),n(494,"code"),e(495,"User"),t(),e(496," entity, as follows:"),t(),n(497,"app-copy-button")(498,"pre")(499,"code",14),e(500,`
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PostsService } from './posts.service';
import { Post } from './post.entity';
import { User } from './user.entity';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly postsService: PostsService) {}

  @ResolveField(() => [Post])
  public posts(@Parent() user: User): Post[] {
    return this.postsService.forAuthor(user.id);
  }
}
`),t()()(),n(501,"p"),e(502,"We also have to define the "),n(503,"code"),e(504,"Post"),t(),e(505," entity class:"),t(),n(506,"app-copy-button")(507,"pre")(508,"code",14),e(509,`
import { Directive, Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { User } from './user.entity';

@ObjectType()
@Directive('@key(fields: "id")')
export class Post {
  @Field(() => ID)
  id: number;

  @Field()
  title: string;

  @Field(() => Int)
  authorId: number;

  @Field(() => User)
  user?: User;
}
`),t()()(),n(510,"p"),e(511,"And its resolver:"),t(),n(512,"app-copy-button")(513,"pre")(514,"code",14),e(515,`
import { Query, Args, ResolveField, Resolver, Parent } from '@nestjs/graphql';
import { PostsService } from './posts.service';
import { Post } from './post.entity';
import { User } from './user.entity';

@Resolver(() => Post)
export class PostsResolver {
  constructor(private readonly postsService: PostsService) {}

  @Query(() => Post)
  findPost(@Args('id') id: number): Post {
    return this.postsService.findOne(id);
  }

  @Query(() => [Post])
  getPosts(): Post[] {
    return this.postsService.all();
  }

  @ResolveField(() => User)
  user(@Parent() post: Post): any {
    return { __typename: 'User', id: post.authorId };
  }
}
`),t()()(),n(516,"p"),e(517,"And finally, tie it together in a module. Note the schema build options, where we specify that "),n(518,"code"),e(519,"User"),t(),e(520," is an orphaned (external) type."),t(),n(521,"app-copy-button")(522,"pre")(523,"code",14),e(524,`
import {
  MercuriusFederationDriver,
  MercuriusFederationDriverConfig,
} from '@nestjs/mercurius';
import { Module } from '@nestjs/common';
import { User } from './user.entity';
import { PostsResolver } from './posts.resolvers';
import { UsersResolver } from './users.resolvers';
import { PostsService } from './posts.service'; // Not included in example

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusFederationDriverConfig>({
      driver: MercuriusFederationDriver,
      autoSchemaFile: true,
      federationMetadata: true,
      buildSchemaOptions: {
        orphanedTypes: [User],
      },
    }),
  ],
  providers: [PostsResolver, UsersResolver, PostsService],
})
export class AppModule {}
`),t()()(),n(525,"h4",32)(526,"span"),e(527,"Federated example: Gateway"),t()(),n(528,"p"),e(529,"The gateway requires a list of endpoints to be specified and it will auto-discover the corresponding schemas. Therefore the implementation of the gateway service will remain the same for both code and schema first approaches."),t(),n(530,"app-copy-button")(531,"pre")(532,"code",12),e(533,`
import {
  MercuriusGatewayDriver,
  MercuriusGatewayDriverConfig,
} from '@nestjs/mercurius';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusGatewayDriverConfig>({
      driver: MercuriusGatewayDriver,
      gateway: {
        services: [
          { name: 'users', url: 'http://user-service/graphql' },
          { name: 'posts', url: 'http://post-service/graphql' },
        ],
      },
    }),
  ],
})
export class AppModule {}
`),t()()(),n(534,"h3",33),e(535,"Federation 2"),t(),n(536,"p"),e(537,"To quote the "),n(538,"a",34),e(539,"Apollo docs"),t(),e(540,", Federation 2 improves developer experience from the original Apollo Federation (called Federation 1 in this doc), which is backward compatible with most original supergraphs."),t(),n(541,"blockquote",7)(542,"strong"),e(543,"Warning"),t(),e(544," Mercurius doesn't fully support Federation 2. You can see the list of libraries that support Federation 2 "),n(545,"a",35),e(546,"here"),t(),e(547,`.
`),t(),n(548,"p"),e(549,"In the following sections, we'll upgrade the previous example to Federation 2."),t(),n(550,"h4",36)(551,"span"),e(552,"Federated example: Users"),t()(),n(553,"p"),e(554,"One change in Federation 2 is that entities have no originating subgraph, so we don't need to extend "),n(555,"code"),e(556,"Query"),t(),e(557," anymore. For more detail please refer to "),n(558,"a",37),e(559,"the entities topic"),t(),e(560," in Apollo Federation 2 docs."),t(),n(561,"h4",38)(562,"span"),e(563,"Schema first"),t()(),n(564,"p"),e(565,"We can simply remove "),n(566,"code"),e(567,"extend"),t(),e(568," keyword from the schema."),t(),n(569,"pre")(570,"code",11),e(571,`
type User @key(fields: "id") {
  id: ID!
  name: String!
}

type Query {
  getUser(id: ID!): User
}
`),t()(),n(572,"h4",39)(573,"span"),e(574,"Code first"),t()(),n(575,"p"),e(576,"To use Federation 2, we need to specify the federation version in "),n(577,"code"),e(578,"autoSchemaFile"),t(),e(579," option."),t(),n(580,"app-copy-button")(581,"pre")(582,"code",14),e(583,`
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service'; // Not included in this example

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: {
        federation: 2,
      },
    }),
  ],
  providers: [UsersResolver, UsersService],
})
export class AppModule {}
`),t()()(),n(584,"h4",40)(585,"span"),e(586,"Federated example: Posts"),t()(),n(587,"p"),e(588,"With the same reason as above, we don't need to extend "),n(589,"code"),e(590,"User"),t(),e(591," and "),n(592,"code"),e(593,"Query"),t(),e(594," anymore."),t(),n(595,"h4",41)(596,"span"),e(597,"Schema first"),t()(),n(598,"p"),e(599,"We can simply remove "),n(600,"code"),e(601,"extend"),t(),e(602," and "),n(603,"code"),e(604,"external"),t(),e(605," directives from the schema"),t(),n(606,"pre")(607,"code",11),e(608,`
type Post @key(fields: "id") {
  id: ID!
  title: String!
  body: String!
  user: User
}

type User @key(fields: "id") {
  id: ID!
  posts: [Post]
}

type Query {
  getPosts: [Post]
}
`),t()(),n(609,"h4",42)(610,"span"),e(611,"Code first"),t()(),n(612,"p"),e(613,"Since we don't extend "),n(614,"code"),e(615,"User"),t(),e(616," entity anymore, we can simply remove "),n(617,"code"),e(618,"extends"),t(),e(619," and "),n(620,"code"),e(621,"external"),t(),e(622," directives from "),n(623,"code"),e(624,"User"),t(),e(625,"."),t(),n(626,"app-copy-button")(627,"pre")(628,"code",14),e(629,`
import { Directive, ObjectType, Field, ID } from '@nestjs/graphql';
import { Post } from './post.entity';

@ObjectType()
@Directive('@key(fields: "id")')
export class User {
  @Field(() => ID)
  id: number;

  @Field(() => [Post])
  posts?: Post[];
}
`),t()()(),n(630,"p"),e(631,"Also, similarly to the User service, we need to specify in the "),n(632,"code"),e(633,"GraphQLModule"),t(),e(634," to use Federation 2."),t(),n(635,"app-copy-button")(636,"pre")(637,"code",14),e(638,`
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { User } from './user.entity';
import { PostsResolver } from './posts.resolvers';
import { UsersResolver } from './users.resolvers';
import { PostsService } from './posts.service'; // Not included in example

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: {
        federation: 2,
      },
      buildSchemaOptions: {
        orphanedTypes: [User],
      },
    }),
  ],
  providers: [PostsResolver, UsersResolver, PostsService],
})
export class AppModule {}
`),t()()()())},dependencies:[c,h],encapsulation:2,changeDetection:0})}return i})();var Q=(()=>{class i extends p{static \u0275fac=(()=>{let r;return function(l){return(r||(r=d(i)))(l||i)}})();static \u0275cmp=s({type:i,selectors:[["app-field-middleware"]],features:[m],decls:144,vars:2,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/graphql/field-middleware.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","field-middleware"],[1,"warning"],["appAnchor","","id","getting-started"],[1,"language-typescript"],[1,"info"],["routerLink","/graphql/extensions"],["href","/graphql/extensions#using-custom-metadata"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/graphql/issues/2446"],["href","/graphql/other-features#execute-enhancers-at-the-field-resolver-level"],["appAnchor","","id","global-field-middleware"]],template:function(o,l){o&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),a(4,"i",4),t()(),n(5,"h3",5),e(6,"Field middleware"),t(),n(7,"blockquote",6)(8,"strong"),e(9,"Warning"),t(),e(10,` This chapter applies only to the code first approach.
`),t(),n(11,"p"),e(12,"Field Middleware lets you run arbitrary code "),n(13,"strong"),e(14,"before or after"),t(),e(15," a field is resolved. A field middleware can be used to convert the result of a field, validate the arguments of a field, or even check field-level roles (for example, required to access a target field for which a middleware function is executed)."),t(),n(16,"p"),e(17,"You can connect multiple middleware functions to a field. In this case, they will be called sequentially along the chain where the previous middleware decides to call the next one. The order of the middleware functions in the "),n(18,"code"),e(19,"middleware"),t(),e(20,' array is important. The first resolver is the "most-outer" layer, so it gets executed first and last (similarly to the '),n(21,"code"),e(22,"graphql-middleware"),t(),e(23,' package). The second resolver is the "second-outer" layer, so it gets executed second and second to last.'),t(),n(24,"h4",7)(25,"span"),e(26,"Getting started"),t()(),n(27,"p"),e(28,"Let's start off by creating a simple middleware that will log a field value before it's sent back to the client:"),t(),n(29,"app-copy-button")(30,"pre")(31,"code",8),e(32,`
import { FieldMiddleware, MiddlewareContext, NextFn } from '@nestjs/graphql';

const loggerMiddleware: FieldMiddleware = async (
  ctx: MiddlewareContext,
  next: NextFn,
) => {
  const value = await next();
  console.log(value);
  return value;
};
`),t()()(),n(33,"blockquote",9)(34,"strong"),e(35,"Hint"),t(),e(36," The "),n(37,"code"),e(38,"MiddlewareContext"),t(),e(39," is an object that consist of the same arguments that are normally received by the GraphQL resolver function ("),n(40,"code"),e(41),t(),e(42,"), while "),n(43,"code"),e(44,"NextFn"),t(),e(45,` is a function that let you execute the next middleware in the stack (bound to this field) or the actual field resolver.
`),t(),n(46,"blockquote",6)(47,"strong"),e(48,"Warning"),t(),e(49," Field middleware functions cannot inject dependencies nor access Nest's DI container as they are designed to be very lightweight and shouldn't perform any potentially time-consuming operations (like retrieving data from the database). If you need to call external services/query data from the data source, you should do it in a guard/interceptor bounded to a root query/mutation handler and assign it to "),n(50,"code"),e(51,"context"),t(),e(52," object which you can access from within the field middleware (specifically, from the "),n(53,"code"),e(54,"MiddlewareContext"),t(),e(55,` object).
`),t(),n(56,"p"),e(57,"Note that field middleware must match the "),n(58,"code"),e(59,"FieldMiddleware"),t(),e(60," interface. In the example above, we first run the "),n(61,"code"),e(62,"next()"),t(),e(63," function (which executes the actual field resolver and returns a field value) and then, we log this value to our terminal. Also, the value returned from the middleware function completely overrides the previous value and since we don't want to perform any changes, we simply return the original value."),t(),n(64,"p"),e(65,"With this in place, we can register our middleware directly in the "),n(66,"code"),e(67,"@Field()"),t(),e(68," decorator, as follows:"),t(),n(69,"app-copy-button")(70,"pre")(71,"code",8),e(72,`
@ObjectType()
export class Recipe {
  @Field({ middleware: [loggerMiddleware] })
  title: string;
}
`),t()()(),n(73,"p"),e(74,"Now whenever we request the "),n(75,"code"),e(76,"title"),t(),e(77," field of "),n(78,"code"),e(79,"Recipe"),t(),e(80," object type, the original field's value will be logged to the console."),t(),n(81,"blockquote",9)(82,"strong"),e(83,"Hint"),t(),e(84," To learn how you can implement a field-level permissions system with the use of "),n(85,"a",10),e(86,"extensions"),t(),e(87," feature, check out this "),n(88,"a",11),e(89,"section"),t(),e(90,`.
`),t(),n(91,"blockquote",6)(92,"strong"),e(93,"Warning"),t(),e(94," Field middleware can be applied only to "),n(95,"code"),e(96,"ObjectType"),t(),e(97," classes. For more details, check out this "),n(98,"a",12),e(99,"issue"),t(),e(100,`.
`),t(),n(101,"p"),e(102,"Also, as mentioned above, we can control the field's value from within the middleware function. For demonstration purposes, let's capitalise a recipe's title (if present):"),t(),n(103,"app-copy-button")(104,"pre")(105,"code",8),e(106,`
const value = await next();
return value?.toUpperCase();
`),t()()(),n(107,"p"),e(108,"In this case, every title will be automatically uppercased, when requested."),t(),n(109,"p"),e(110,"Likewise, you can bind a field middleware to a custom field resolver (a method annotated with the "),n(111,"code"),e(112,"@ResolveField()"),t(),e(113," decorator), as follows:"),t(),n(114,"app-copy-button")(115,"pre")(116,"code",8),e(117,`
@ResolveField(() => String, { middleware: [loggerMiddleware] })
title() {
  return 'Placeholder';
}
`),t()()(),n(118,"blockquote",6)(119,"strong"),e(120,"Warning"),t(),e(121," In case enhancers are enabled at the field resolver level ("),n(122,"a",13),e(123,"read more"),t(),e(124,"), field middleware functions will run before any interceptors, guards, etc., "),n(125,"strong"),e(126,"bounded to the method"),t(),e(127,` (but after the root-level enhancers registered for query or mutation handlers).
`),t(),n(128,"h4",14)(129,"span"),e(130,"Global field middleware"),t()(),n(131,"p"),e(132,"In addition to binding a middleware directly to a specific field, you can also register one or multiple middleware functions globally. In this case, they will be automatically connected to all fields of your object types."),t(),n(133,"app-copy-button")(134,"pre")(135,"code",8),e(136,`
GraphQLModule.forRoot({
  autoSchemaFile: 'schema.gql',
  buildSchemaOptions: {
    fieldMiddleware: [loggerMiddleware],
  },
}),
`),t()()(),n(137,"blockquote",9)(138,"strong"),e(139,"Hint"),t(),e(140," Globally registered field middleware functions will be executed "),n(141,"strong"),e(142,"before"),t(),e(143,` locally registered ones (those bound directly to specific fields).
`),t()()),o&2&&(u(41),w("","{"," source, args, context, info ","}"))},dependencies:[c,h,x],encapsulation:2,changeDetection:0})}return i})();var G=(()=>{class i extends p{static \u0275fac=(()=>{let r;return function(l){return(r||(r=d(i)))(l||i)}})();static \u0275cmp=s({type:i,selectors:[["app-guards-interceptors"]],features:[m],decls:246,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/graphql/guards-interceptors.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","other-features"],["rel","nofollow","target","_blank","href","https://www.apollographql.com/docs/apollo-server/schema/directives/"],["routerLink","/guards"],["routerLink","/interceptors"],["appAnchor","","id","overview"],["routerLink","/exception-filters"],["routerLink","/pipes"],["routerLink","/custom-decorators"],[1,"language-typescript"],["appAnchor","","id","execution-context"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/fundamentals/execution-context"],["appAnchor","","id","exception-filters"],[1,"info"],["appAnchor","","id","custom-decorators"],["appAnchor","","id","execute-enhancers-at-the-field-resolver-level"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/graphql/issues/320#issuecomment-511193229"],[1,""],["appAnchor","","id","creating-a-custom-driver"]],template:function(o,l){o&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),a(4,"i",4),t()(),n(5,"h3",5),e(6,"Other features"),t(),n(7,"p"),e(8,"In the GraphQL world, there is a lot of debate about handling issues like "),n(9,"strong"),e(10,"authentication"),t(),e(11,", or "),n(12,"strong"),e(13,"side-effects"),t(),e(14," of operations. Should we handle things inside the business logic? Should we use a higher-order function to enhance queries and mutations with authorization logic? Or should we use "),n(15,"a",6),e(16,"schema directives"),t(),e(17,"? There is no single one-size-fits-all answer to these questions."),t(),n(18,"p"),e(19,"Nest helps address these issues with its cross-platform features like "),n(20,"a",7),e(21,"guards"),t(),e(22," and "),n(23,"a",8),e(24,"interceptors"),t(),e(25,". The philosophy is to reduce redundancy and provide tooling that helps create well-structured, readable, and consistent applications."),t(),n(26,"h4",9)(27,"span"),e(28,"Overview"),t()(),n(29,"p"),e(30,"You can use standard "),n(31,"a",7),e(32,"guards"),t(),e(33,", "),n(34,"a",8),e(35,"interceptors"),t(),e(36,", "),n(37,"a",10),e(38,"filters"),t(),e(39," and "),n(40,"a",11),e(41,"pipes"),t(),e(42," in the same fashion with GraphQL as with any RESTful application. Additionally, you can easily create your own decorators by leveraging the "),n(43,"a",12),e(44,"custom decorators"),t(),e(45," feature. Let's take a look at a sample GraphQL query handler."),t(),n(46,"app-copy-button")(47,"pre")(48,"code",13),e(49,`
@Query('author')
@UseGuards(AuthGuard)
async getAuthor(@Args('id', ParseIntPipe) id: number) {
  return this.authorsService.findOneById(id);
}
`),t()()(),n(50,"p"),e(51,"As you can see, GraphQL works with both guards and pipes in the same way as HTTP REST handlers. Because of this, you can move your authentication logic to a guard; you can even reuse the same guard class across both a REST and GraphQL API interface. Similarly, interceptors work across both types of applications in the same way:"),t(),n(52,"app-copy-button")(53,"pre")(54,"code",13),e(55,`
@Mutation()
@UseInterceptors(EventsInterceptor)
async upvotePost(@Args('postId') postId: number) {
  return this.postsService.upvoteById({ id: postId });
}
`),t()()(),n(56,"h4",14)(57,"span"),e(58,"Execution context"),t()(),n(59,"p"),e(60,"Since GraphQL receives a different type of data in the incoming request, the "),n(61,"a",15),e(62,"execution context"),t(),e(63," received by both guards and interceptors is somewhat different with GraphQL vs. REST. GraphQL resolvers have a distinct set of arguments: "),n(64,"code"),e(65,"root"),t(),e(66,", "),n(67,"code"),e(68,"args"),t(),e(69,", "),n(70,"code"),e(71,"context"),t(),e(72,", and "),n(73,"code"),e(74,"info"),t(),e(75,". Thus guards and interceptors must transform the generic "),n(76,"code"),e(77,"ExecutionContext"),t(),e(78," to a "),n(79,"code"),e(80,"GqlExecutionContext"),t(),e(81,". This is straightforward:"),t(),n(82,"app-copy-button")(83,"pre")(84,"code",13),e(85,`
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);
    return true;
  }
}
`),t()()(),n(86,"p"),e(87,"The GraphQL context object returned by "),n(88,"code"),e(89,"GqlExecutionContext.create()"),t(),e(90," exposes a "),n(91,"strong"),e(92,"get"),t(),e(93," method for each GraphQL resolver argument (e.g., "),n(94,"code"),e(95,"getArgs()"),t(),e(96,", "),n(97,"code"),e(98,"getContext()"),t(),e(99,", etc). Once transformed, we can easily pick out any GraphQL argument for the current request."),t(),n(100,"h4",16)(101,"span"),e(102,"Exception filters"),t()(),n(103,"p"),e(104,"Nest standard "),n(105,"a",10),e(106,"exception filters"),t(),e(107," are compatible with GraphQL applications as well. As with "),n(108,"code"),e(109,"ExecutionContext"),t(),e(110,", GraphQL apps should transform the "),n(111,"code"),e(112,"ArgumentsHost"),t(),e(113," object to a "),n(114,"code"),e(115,"GqlArgumentsHost"),t(),e(116," object."),t(),n(117,"app-copy-button")(118,"pre")(119,"code",13),e(120,`
@Catch(HttpException)
export class HttpExceptionFilter implements GqlExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);
    return exception;
  }
}
`),t()()(),n(121,"blockquote",17)(122,"strong"),e(123,"Hint"),t(),e(124," Both "),n(125,"code"),e(126,"GqlExceptionFilter"),t(),e(127," and "),n(128,"code"),e(129,"GqlArgumentsHost"),t(),e(130," are imported from the "),n(131,"code"),e(132,"@nestjs/graphql"),t(),e(133,` package.
`),t(),n(134,"p"),e(135,"Note that unlike the REST case, you don't use the native "),n(136,"code"),e(137,"response"),t(),e(138," object to generate a response."),t(),n(139,"h4",18)(140,"span"),e(141,"Custom decorators"),t()(),n(142,"p"),e(143,"As mentioned, the "),n(144,"a",12),e(145,"custom decorators"),t(),e(146," feature works as expected with GraphQL resolvers."),t(),n(147,"app-copy-button")(148,"pre")(149,"code",13),e(150,`
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) =>
    GqlExecutionContext.create(ctx).getContext().user,
);
`),t()()(),n(151,"p"),e(152,"Use the "),n(153,"code"),e(154,"@User()"),t(),e(155," custom decorator as follows:"),t(),n(156,"app-copy-button")(157,"pre")(158,"code",13),e(159,`
@Mutation()
async upvotePost(
  @User() user: UserEntity,
  @Args('postId') postId: number,
) {}
`),t()()(),n(160,"blockquote",17)(161,"strong"),e(162,"Hint"),t(),e(163," In the above example, we have assumed that the "),n(164,"code"),e(165,"user"),t(),e(166,` object is assigned to the context of your GraphQL application.
`),t(),n(167,"h4",19)(168,"span"),e(169,"Execute enhancers at the field resolver level"),t()(),n(170,"p"),e(171,"In the GraphQL context, Nest does not run "),n(172,"strong"),e(173,"enhancers"),t(),e(174," (the generic name for interceptors, guards and filters) at the field level "),n(175,"a",20),e(176,"see this issue"),t(),e(177,": they only run for the top level "),n(178,"code"),e(179,"@Query()"),t(),e(180,"/"),n(181,"code"),e(182,"@Mutation()"),t(),e(183," method. You can tell Nest to execute interceptors, guards or filters for methods annotated with "),n(184,"code"),e(185,"@ResolveField()"),t(),e(186," by setting the "),n(187,"code"),e(188,"fieldResolverEnhancers"),t(),e(189," option in "),n(190,"code"),e(191,"GqlModuleOptions"),t(),e(192,". Pass it a list of "),n(193,"code"),e(194,"'interceptors'"),t(),e(195,", "),n(196,"code"),e(197,"'guards'"),t(),e(198,", and/or "),n(199,"code"),e(200,"'filters'"),t(),e(201," as appropriate:"),t(),n(202,"app-copy-button")(203,"pre")(204,"code",13),e(205,`
GraphQLModule.forRoot({
  fieldResolverEnhancers: ['interceptors']
}),
`),t()()(),n(206,"blockquote",21)(207,"strong"),e(208,"Warning"),t(),e(209," Enabling enhancers for field resolvers can cause performance issues when you are returning lots of records and your field resolver is executed thousands of times. For this reason, when you enable "),n(210,"code"),e(211,"fieldResolverEnhancers"),t(),e(212,`, we advise you to skip execution of enhancers that are not strictly necessary for your field resolvers. You can do this using the following helper function:
`),t(),n(213,"app-copy-button")(214,"pre")(215,"code",13),e(216,`
export function isResolvingGraphQLField(context: ExecutionContext): boolean {
  if (context.getType<GqlContextType>() === 'graphql') {
    const gqlContext = GqlExecutionContext.create(context);
    const info = gqlContext.getInfo();
    const parentType = info.parentType.name;
    return parentType !== 'Query' && parentType !== 'Mutation';
  }
  return false;
}
`),t()()(),n(217,"h4",22)(218,"span"),e(219,"Creating a custom driver"),t()(),n(220,"p"),e(221,"Nest provides two official drivers out-of-the-box: "),n(222,"code"),e(223,"@nestjs/apollo"),t(),e(224," and "),n(225,"code"),e(226,"@nestjs/mercurius"),t(),e(227,", as well as an API allowing developers to build new "),n(228,"strong"),e(229,"custom drivers"),t(),e(230,". With a custom driver, you can integrate any GraphQL library or extend the existing integration, adding extra features on top."),t(),n(231,"p"),e(232,"For example, to integrate the "),n(233,"code"),e(234,"express-graphql"),t(),e(235," package, you could create the following driver class:"),t(),n(236,"app-copy-button")(237,"pre")(238,"code",13),e(239,`
import { AbstractGraphQLDriver, GqlModuleOptions } from '@nestjs/graphql';
import { graphqlHTTP } from 'express-graphql';

class ExpressGraphQLDriver extends AbstractGraphQLDriver {
  async start(options: GqlModuleOptions<any>): Promise<void> {
    options = await this.graphQlFactory.mergeWithSchema(options);

    const { httpAdapter } = this.httpAdapterHost;
    httpAdapter.use(
      '/graphql',
      graphqlHTTP({
        schema: options.schema,
        graphiql: true,
      }),
    );
  }

  async stop() {}
}
`),t()()(),n(240,"p"),e(241,"And then use it as follows:"),t(),n(242,"app-copy-button")(243,"pre")(244,"code",13),e(245,`
GraphQLModule.forRoot({
  driver: ExpressGraphQLDriver,
});
`),t()()()())},dependencies:[x,c,h],encapsulation:2,changeDetection:0})}return i})();var M=(()=>{class i extends p{static \u0275fac=(()=>{let r;return function(l){return(r||(r=d(i)))(l||i)}})();static \u0275cmp=s({type:i,selectors:[["app-interfaces"]],features:[m],decls:147,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/graphql/interfaces.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","interfaces"],["rel","nofollow","target","_blank","href","https://graphql.org/learn/schema/#interfaces"],["appAnchor","","id","code-first"],[1,"language-typescript"],[1,"warning"],[1,"language-graphql"],[1,"info"],["appAnchor","","id","interface-resolvers"],["appAnchor","","id","schema-first"],["routerLink","/graphql/quick-start"]],template:function(o,l){o&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),a(4,"i",4),t()(),n(5,"h3",5),e(6,"Interfaces"),t(),n(7,"p"),e(8,"Like many type systems, GraphQL supports interfaces. An "),n(9,"strong"),e(10,"Interface"),t(),e(11," is an abstract type that includes a certain set of fields that a type must include to implement the interface (read more "),n(12,"a",6),e(13,"here"),t(),e(14,")."),t(),n(15,"h4",7)(16,"span"),e(17,"Code first"),t()(),n(18,"p"),e(19,"When using the code first approach, you define a GraphQL interface by creating an abstract class annotated with the "),n(20,"code"),e(21,"@InterfaceType()"),t(),e(22," decorator exported from the "),n(23,"code"),e(24,"@nestjs/graphql"),t(),e(25,"."),t(),n(26,"app-copy-button")(27,"pre")(28,"code",8),e(29,`
import { Field, ID, InterfaceType } from '@nestjs/graphql';

@InterfaceType()
export abstract class Character {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;
}
`),t()()(),n(30,"blockquote",9)(31,"strong"),e(32,"Warning"),t(),e(33,` TypeScript interfaces cannot be used to define GraphQL interfaces.
`),t(),n(34,"p"),e(35,"This will result in generating the following part of the GraphQL schema in SDL:"),t(),n(36,"pre")(37,"code",10),e(38,`
interface Character {
  id: ID!
  name: String!
}
`),t()(),n(39,"p"),e(40,"Now, to implement the "),n(41,"code"),e(42,"Character"),t(),e(43," interface, use the "),n(44,"code"),e(45,"implements"),t(),e(46," key:"),t(),n(47,"app-copy-button")(48,"pre")(49,"code",8),e(50,`
@ObjectType({
  implements: () => [Character],
})
export class Human implements Character {
  id: string;
  name: string;
}
`),t()()(),n(51,"blockquote",11)(52,"strong"),e(53,"Hint"),t(),e(54," The "),n(55,"code"),e(56,"@ObjectType()"),t(),e(57," decorator is exported from the "),n(58,"code"),e(59,"@nestjs/graphql"),t(),e(60,` package.
`),t(),n(61,"p"),e(62,"The default "),n(63,"code"),e(64,"resolveType()"),t(),e(65," function generated by the library extracts the type based on the value returned from the resolver method. This means that you must return class instances (you cannot return literal JavaScript objects)."),t(),n(66,"p"),e(67,"To provide a customized "),n(68,"code"),e(69,"resolveType()"),t(),e(70," function, pass the "),n(71,"code"),e(72,"resolveType"),t(),e(73," property to the options object passed into the "),n(74,"code"),e(75,"@InterfaceType()"),t(),e(76," decorator, as follows:"),t(),n(77,"app-copy-button")(78,"pre")(79,"code",8),e(80,`
@InterfaceType({
  resolveType(book) {
    if (book.colors) {
      return ColoringBook;
    }
    return TextBook;
  },
})
export abstract class Book {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;
}
`),t()()(),n(81,"h4",12)(82,"span"),e(83,"Interface resolvers"),t()(),n(84,"p"),e(85,"So far, using interfaces, you could only share field definitions with your objects. If you also want to share the actual field resolvers implementation, you can create a dedicated interface resolver, as follows:"),t(),n(86,"app-copy-button")(87,"pre")(88,"code",8),e(89,`
import { Resolver, ResolveField, Parent, Info } from '@nestjs/graphql';

@Resolver((type) => Character) // Reminder: Character is an interface
export class CharacterInterfaceResolver {
  @ResolveField(() => [Character])
  friends(
    @Parent() character, // Resolved object that implements Character
    @Info() { parentType }, // Type of the object that implements Character
    @Args('search', { type: () => String }) searchTerm: string,
  ) {
    // Get character's friends
    return [];
  }
}
`),t()()(),n(90,"p"),e(91,"Now the "),n(92,"code"),e(93,"friends"),t(),e(94," field resolver is auto-registered for all object types that implement the "),n(95,"code"),e(96,"Character"),t(),e(97," interface."),t(),n(98,"blockquote",9)(99,"strong"),e(100,"Warning"),t(),e(101," This requires the "),n(102,"code"),e(103,"inheritResolversFromInterfaces"),t(),e(104," property set to be true in the "),n(105,"code"),e(106,"GraphQLModule"),t(),e(107,` configuration.
`),t(),n(108,"h4",13)(109,"span"),e(110,"Schema first"),t()(),n(111,"p"),e(112,"To define an interface in the schema first approach, simply create a GraphQL interface with SDL."),t(),n(113,"pre")(114,"code",10),e(115,`
interface Character {
  id: ID!
  name: String!
}
`),t()(),n(116,"p"),e(117,"Then, you can use the typings generation feature (as shown in the "),n(118,"a",14),e(119,"quick start"),t(),e(120," chapter) to generate corresponding TypeScript definitions:"),t(),n(121,"app-copy-button")(122,"pre")(123,"code",8),e(124,`
export interface Character {
  id: string;
  name: string;
}
`),t()()(),n(125,"p"),e(126,"Interfaces require an extra "),n(127,"code"),e(128,"__resolveType"),t(),e(129," field in the resolver map to determine which type the interface should resolve to. Let's create a "),n(130,"code"),e(131,"CharactersResolver"),t(),e(132," class and define the "),n(133,"code"),e(134,"__resolveType"),t(),e(135," method:"),t(),n(136,"app-copy-button")(137,"pre")(138,"code",8),e(139,`
@Resolver('Character')
export class CharactersResolver {
  @ResolveField()
  __resolveType(value) {
    if ('age' in value) {
      return Person;
    }
    return null;
  }
}
`),t()()(),n(140,"blockquote",11)(141,"strong"),e(142,"Hint"),t(),e(143," All decorators are exported from the "),n(144,"code"),e(145,"@nestjs/graphql"),t(),e(146,` package.
`),t()())},dependencies:[c,h,x],encapsulation:2,changeDetection:0})}return i})();var U=(()=>{class i extends p{static \u0275fac=(()=>{let r;return function(l){return(r||(r=d(i)))(l||i)}})();static \u0275cmp=s({type:i,selectors:[["app-mapped-types"]],features:[m],decls:212,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/graphql/mapped-types.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","mapped-types"],[1,"warning"],["appAnchor","","id","partial"],[1,"language-typescript"],[1,"info"],["appAnchor","","id","pick"],["appAnchor","","id","omit"],["appAnchor","","id","intersection"],["appAnchor","","id","composition"]],template:function(o,l){o&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),a(4,"i",4),t()(),n(5,"h3",5),e(6,"Mapped types"),t(),n(7,"blockquote",6)(8,"strong"),e(9,"Warning"),t(),e(10,` This chapter applies only to the code first approach.
`),t(),n(11,"p"),e(12,"As you build out features like CRUD (Create/Read/Update/Delete) it's often useful to construct variants on a base entity type. Nest provides several utility functions that perform type transformations to make this task more convenient."),t(),n(13,"h4",7)(14,"span"),e(15,"Partial"),t()(),n(16,"p"),e(17,"When building input validation types (also called Data Transfer Objects or DTOs), it's often useful to build "),n(18,"strong"),e(19,"create"),t(),e(20," and "),n(21,"strong"),e(22,"update"),t(),e(23," variations on the same type. For example, the "),n(24,"strong"),e(25,"create"),t(),e(26," variant may require all fields, while the "),n(27,"strong"),e(28,"update"),t(),e(29," variant may make all fields optional."),t(),n(30,"p"),e(31,"Nest provides the "),n(32,"code"),e(33,"PartialType()"),t(),e(34," utility function to make this task easier and minimize boilerplate."),t(),n(35,"p"),e(36,"The "),n(37,"code"),e(38,"PartialType()"),t(),e(39," function returns a type (class) with all the properties of the input type set to optional. For example, suppose we have a "),n(40,"strong"),e(41,"create"),t(),e(42," type as follows:"),t(),n(43,"app-copy-button")(44,"pre")(45,"code",8),e(46,`
@InputType()
class CreateUserInput {
  @Field()
  email: string;

  @Field()
  password: string;

  @Field()
  firstName: string;
}
`),t()()(),n(47,"p"),e(48,"By default, all of these fields are required. To create a type with the same fields, but with each one optional, use "),n(49,"code"),e(50,"PartialType()"),t(),e(51," passing the class reference ("),n(52,"code"),e(53,"CreateUserInput"),t(),e(54,") as an argument:"),t(),n(55,"app-copy-button")(56,"pre")(57,"code",8),e(58,`
@InputType()
export class UpdateUserInput extends PartialType(CreateUserInput) {}
`),t()()(),n(59,"blockquote",9)(60,"strong"),e(61,"Hint"),t(),e(62," The "),n(63,"code"),e(64,"PartialType()"),t(),e(65," function is imported from the "),n(66,"code"),e(67,"@nestjs/graphql"),t(),e(68,` package.
`),t(),n(69,"p"),e(70,"The "),n(71,"code"),e(72,"PartialType()"),t(),e(73," function takes an optional second argument that is a reference to a decorator factory. This argument can be used to change the decorator function applied to the resulting (child) class. If not specified, the child class effectively uses the same decorator as the "),n(74,"strong"),e(75,"parent"),t(),e(76," class (the class referenced in the first argument). In the example above, we are extending "),n(77,"code"),e(78,"CreateUserInput"),t(),e(79," which is annotated with the "),n(80,"code"),e(81,"@InputType()"),t(),e(82," decorator. Since we want "),n(83,"code"),e(84,"UpdateUserInput"),t(),e(85," to also be treated as if it were decorated with "),n(86,"code"),e(87,"@InputType()"),t(),e(88,", we didn't need to pass "),n(89,"code"),e(90,"InputType"),t(),e(91," as the second argument. If the parent and child types are different, (e.g., the parent is decorated with "),n(92,"code"),e(93,"@ObjectType"),t(),e(94,"), we would pass "),n(95,"code"),e(96,"InputType"),t(),e(97," as the second argument. For example:"),t(),n(98,"app-copy-button")(99,"pre")(100,"code",8),e(101,`
@InputType()
export class UpdateUserInput extends PartialType(User, InputType) {}
`),t()()(),n(102,"h4",10)(103,"span"),e(104,"Pick"),t()(),n(105,"p"),e(106,"The "),n(107,"code"),e(108,"PickType()"),t(),e(109," function constructs a new type (class) by picking a set of properties from an input type. For example, suppose we start with a type like:"),t(),n(110,"app-copy-button")(111,"pre")(112,"code",8),e(113,`
@InputType()
class CreateUserInput {
  @Field()
  email: string;

  @Field()
  password: string;

  @Field()
  firstName: string;
}
`),t()()(),n(114,"p"),e(115,"We can pick a set of properties from this class using the "),n(116,"code"),e(117,"PickType()"),t(),e(118," utility function:"),t(),n(119,"app-copy-button")(120,"pre")(121,"code",8),e(122,`
@InputType()
export class UpdateEmailInput extends PickType(CreateUserInput, [
  'email',
] as const) {}
`),t()()(),n(123,"blockquote",9)(124,"strong"),e(125,"Hint"),t(),e(126," The "),n(127,"code"),e(128,"PickType()"),t(),e(129," function is imported from the "),n(130,"code"),e(131,"@nestjs/graphql"),t(),e(132,` package.
`),t(),n(133,"h4",11)(134,"span"),e(135,"Omit"),t()(),n(136,"p"),e(137,"The "),n(138,"code"),e(139,"OmitType()"),t(),e(140," function constructs a type by picking all properties from an input type and then removing a particular set of keys. For example, suppose we start with a type like:"),t(),n(141,"app-copy-button")(142,"pre")(143,"code",8),e(144,`
@InputType()
class CreateUserInput {
  @Field()
  email: string;

  @Field()
  password: string;

  @Field()
  firstName: string;
}
`),t()()(),n(145,"p"),e(146,"We can generate a derived type that has every property "),n(147,"strong"),e(148,"except"),t(),n(149,"code"),e(150,"email"),t(),e(151," as shown below. In this construct, the second argument to "),n(152,"code"),e(153,"OmitType"),t(),e(154," is an array of property names."),t(),n(155,"app-copy-button")(156,"pre")(157,"code",8),e(158,`
@InputType()
export class UpdateUserInput extends OmitType(CreateUserInput, [
  'email',
] as const) {}
`),t()()(),n(159,"blockquote",9)(160,"strong"),e(161,"Hint"),t(),e(162," The "),n(163,"code"),e(164,"OmitType()"),t(),e(165," function is imported from the "),n(166,"code"),e(167,"@nestjs/graphql"),t(),e(168,` package.
`),t(),n(169,"h4",12)(170,"span"),e(171,"Intersection"),t()(),n(172,"p"),e(173,"The "),n(174,"code"),e(175,"IntersectionType()"),t(),e(176," function combines two types into one new type (class). For example, suppose we start with two types like:"),t(),n(177,"app-copy-button")(178,"pre")(179,"code",8),e(180,`
@InputType()
class CreateUserInput {
  @Field()
  email: string;

  @Field()
  password: string;
}

@ObjectType()
export class AdditionalUserInfo {
  @Field()
  firstName: string;

  @Field()
  lastName: string;
}
`),t()()(),n(181,"p"),e(182,"We can generate a new type that combines all properties in both types."),t(),n(183,"app-copy-button")(184,"pre")(185,"code",8),e(186,`
@InputType()
export class UpdateUserInput extends IntersectionType(
  CreateUserInput,
  AdditionalUserInfo,
) {}
`),t()()(),n(187,"blockquote",9)(188,"strong"),e(189,"Hint"),t(),e(190," The "),n(191,"code"),e(192,"IntersectionType()"),t(),e(193," function is imported from the "),n(194,"code"),e(195,"@nestjs/graphql"),t(),e(196,` package.
`),t(),n(197,"h4",13)(198,"span"),e(199,"Composition"),t()(),n(200,"p"),e(201,"The type mapping utility functions are composable. For example, the following will produce a type (class) that has all of the properties of the "),n(202,"code"),e(203,"CreateUserInput"),t(),e(204," type except for "),n(205,"code"),e(206,"email"),t(),e(207,", and those properties will be set to optional:"),t(),n(208,"app-copy-button")(209,"pre")(210,"code",8),e(211,`
@InputType()
export class UpdateUserInput extends PartialType(
  OmitType(CreateUserInput, ['email'] as const),
) {}
`),t()()()())},dependencies:[c,h],encapsulation:2,changeDetection:0})}return i})();var N=(()=>{class i extends p{static \u0275fac=(()=>{let r;return function(l){return(r||(r=d(i)))(l||i)}})();static \u0275cmp=s({type:i,selectors:[["app-mutations"]],features:[m],decls:149,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/graphql/mutations.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","mutations"],["rel","nofollow","target","_blank","href","https://graphql.org/learn/queries/#mutations"],["rel","nofollow","target","_blank","href","https://www.apollographql.com/docs/graphql-tools/generate-schema.html"],["appAnchor","","id","code-first"],["routerLink","/graphql/resolvers"],[1,"language-typescript"],[1,"info"],[1,"language-graphql"],["rel","nofollow","target","_blank","href","https://graphql.org/learn/schema/#input-types"],["routerLink","/graphql/cli-plugin"],["appAnchor","","id","schema-first"]],template:function(o,l){o&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),a(4,"i",4),t()(),n(5,"h3",5),e(6,"Mutations"),t(),n(7,"p"),e(8,"Most discussions of GraphQL focus on data fetching, but any complete data platform needs a way to modify server-side data as well. In REST, any request could end up causing side-effects on the server, but best practice suggests we should not modify data in GET requests. GraphQL is similar - technically any query could be implemented to cause a data write. However, like REST, it's recommended to observe the convention that any operations that cause writes should be sent explicitly via a mutation (read more "),n(9,"a",6),e(10,"here"),t(),e(11,")."),t(),n(12,"p"),e(13,"The official "),n(14,"a",7),e(15,"Apollo"),t(),e(16," documentation uses an "),n(17,"code"),e(18,"upvotePost()"),t(),e(19," mutation example. This mutation implements a method to increase a post's "),n(20,"code"),e(21,"votes"),t(),e(22," property value. To create an equivalent mutation in Nest, we'll make use of the "),n(23,"code"),e(24,"@Mutation()"),t(),e(25," decorator."),t(),n(26,"h4",8)(27,"span"),e(28,"Code first"),t()(),n(29,"p"),e(30,"Let's add another method to the "),n(31,"code"),e(32,"AuthorResolver"),t(),e(33," used in the previous section (see "),n(34,"a",9),e(35,"resolvers"),t(),e(36,")."),t(),n(37,"app-copy-button")(38,"pre")(39,"code",10),e(40,`
@Mutation(() => Post)
async upvotePost(@Args({ name: 'postId', type: () => Int }) postId: number) {
  return this.postsService.upvoteById({ id: postId });
}
`),t()()(),n(41,"blockquote",11)(42,"strong"),e(43,"Hint"),t(),e(44," All decorators (e.g., "),n(45,"code"),e(46,"@Resolver"),t(),e(47,", "),n(48,"code"),e(49,"@ResolveField"),t(),e(50,", "),n(51,"code"),e(52,"@Args"),t(),e(53,", etc.) are exported from the "),n(54,"code"),e(55,"@nestjs/graphql"),t(),e(56,` package.
`),t(),n(57,"p"),e(58,"This will result in generating the following part of the GraphQL schema in SDL:"),t(),n(59,"pre")(60,"code",12),e(61,`
type Mutation {
  upvotePost(postId: Int!): Post
}
`),t()(),n(62,"p"),e(63,"The "),n(64,"code"),e(65,"upvotePost()"),t(),e(66," method takes "),n(67,"code"),e(68,"postId"),t(),e(69," ("),n(70,"code"),e(71,"Int"),t(),e(72,") as an argument and returns an updated "),n(73,"code"),e(74,"Post"),t(),e(75," entity. For the reasons explained in the "),n(76,"a",9),e(77,"resolvers"),t(),e(78," section, we have to explicitly set the expected type."),t(),n(79,"p"),e(80,"If the mutation needs to take an object as an argument, we can create an "),n(81,"strong"),e(82,"input type"),t(),e(83,". The input type is a special kind of object type that can be passed in as an argument (read more "),n(84,"a",13),e(85,"here"),t(),e(86,"). To declare an input type, use the "),n(87,"code"),e(88,"@InputType()"),t(),e(89," decorator."),t(),n(90,"app-copy-button")(91,"pre")(92,"code",10),e(93,`
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UpvotePostInput {
  @Field()
  postId: number;
}
`),t()()(),n(94,"blockquote",11)(95,"strong"),e(96,"Hint"),t(),e(97," The "),n(98,"code"),e(99,"@InputType()"),t(),e(100," decorator takes an options object as an argument, so you can, for example, specify the input type's description. Note that, due to TypeScript's metadata reflection system limitations, you must either use the "),n(101,"code"),e(102,"@Field"),t(),e(103," decorator to manually indicate a type, or use a "),n(104,"a",14),e(105,"CLI plugin"),t(),e(106,`.
`),t(),n(107,"p"),e(108,"We can then use this type in the resolver class:"),t(),n(109,"app-copy-button")(110,"pre")(111,"code",10),e(112,`
@Mutation(() => Post)
async upvotePost(
  @Args('upvotePostData') upvotePostData: UpvotePostInput,
) {}
`),t()()(),n(113,"h4",15)(114,"span"),e(115,"Schema first"),t()(),n(116,"p"),e(117,"Let's extend our "),n(118,"code"),e(119,"AuthorResolver"),t(),e(120," used in the previous section (see "),n(121,"a",9),e(122,"resolvers"),t(),e(123,")."),t(),n(124,"app-copy-button")(125,"pre")(126,"code",10),e(127,`
@Mutation()
async upvotePost(@Args('postId') postId: number) {
  return this.postsService.upvoteById({ id: postId });
}
`),t()()(),n(128,"p"),e(129,"Note that we assumed above that the business logic has been moved to the "),n(130,"code"),e(131,"PostsService"),t(),e(132," (querying the post and incrementing its "),n(133,"code"),e(134,"votes"),t(),e(135," property). The logic inside the "),n(136,"code"),e(137,"PostsService"),t(),e(138," class can be as simple or sophisticated as needed. The main point of this example is to show how resolvers can interact with other providers."),t(),n(139,"p"),e(140,"The last step is to add our mutation to the existing types definition."),t(),n(141,"pre")(142,"code",12),e(143,`
type Author {
  id: Int!
  firstName: String
  lastName: String
  posts: [Post]
}

type Post {
  id: Int!
  title: String
  votes: Int
}

type Query {
  author(id: Int!): Author
}

type Mutation {
  upvotePost(postId: Int!): Post
}
`),t()(),n(144,"p"),e(145,"The "),n(146,"code"),e(147,"upvotePost(postId: Int!): Post"),t(),e(148," mutation is now available to be called as part of our application's GraphQL API."),t()())},dependencies:[c,x,h],encapsulation:2,changeDetection:0})}return i})();var B=(()=>{class i extends p{static \u0275fac=(()=>{let r;return function(l){return(r||(r=d(i)))(l||i)}})();static \u0275cmp=s({type:i,selectors:[["app-plugins"]],features:[m],decls:101,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/graphql/plugins.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","plugins-with-apollo"],["rel","nofollow","target","_blank","href","https://www.apollographql.com/docs/apollo-server/integrations/plugins/"],["appAnchor","","id","custom-plugins"],[1,"language-typescript"],["appAnchor","","id","using-external-plugins"],[1,"info"],["appAnchor","","id","plugins-with-mercurius"],["rel","nofollow","target","_blank","href","https://mercurius.dev/#/docs/plugins"],[1,"warning"],["rel","nofollow","target","_blank","href","https://github.com/mercurius-js/mercurius-upload"],["rel","nofollow","target","_blank","href","https://github.com/mercurius-js/cache"]],template:function(o,l){o&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),a(4,"i",4),t()(),n(5,"h3",5),e(6,"Plugins with Apollo"),t(),n(7,"p"),e(8,"Plugins enable you to extend Apollo Server's core functionality by performing custom operations in response to certain events. Currently, these events correspond to individual phases of the GraphQL request lifecycle, and to the startup of Apollo Server itself (read more "),n(9,"a",6),e(10,"here"),t(),e(11,"). For example, a basic logging plugin might log the GraphQL query string associated with each request that's sent to Apollo Server."),t(),n(12,"h4",7)(13,"span"),e(14,"Custom plugins"),t()(),n(15,"p"),e(16,"To create a plugin, declare a class annotated with the "),n(17,"code"),e(18,"@Plugin"),t(),e(19," decorator exported from the "),n(20,"code"),e(21,"@nestjs/apollo"),t(),e(22," package. Also, for better code autocompletion, implement the "),n(23,"code"),e(24,"ApolloServerPlugin"),t(),e(25," interface from the "),n(26,"code"),e(27,"@apollo/server"),t(),e(28," package."),t(),n(29,"app-copy-button")(30,"pre")(31,"code",8),e(32,`
import { ApolloServerPlugin, GraphQLRequestListener } from '@apollo/server';
import { Plugin } from '@nestjs/apollo';

@Plugin()
export class LoggingPlugin implements ApolloServerPlugin {
  async requestDidStart(): Promise<GraphQLRequestListener<any>> {
    console.log('Request started');
    return {
      async willSendResponse() {
        console.log('Will send response');
      },
    };
  }
}
`),t()()(),n(33,"p"),e(34,"With this in place, we can register the "),n(35,"code"),e(36,"LoggingPlugin"),t(),e(37," as a provider."),t(),n(38,"app-copy-button")(39,"pre")(40,"code",8),e(41,`
@Module({
  providers: [LoggingPlugin],
})
export class CommonModule {}
`),t()()(),n(42,"p"),e(43,"Nest will automatically instantiate a plugin and apply it to the Apollo Server."),t(),n(44,"h4",9)(45,"span"),e(46,"Using external plugins"),t()(),n(47,"p"),e(48,"There are several plugins provided out-of-the-box. To use an existing plugin, simply import it and add it to the "),n(49,"code"),e(50,"plugins"),t(),e(51," array:"),t(),n(52,"app-copy-button")(53,"pre")(54,"code",8),e(55,`
GraphQLModule.forRoot({
  // ...
  plugins: [ApolloServerOperationRegistry({ /* options */})]
}),
`),t()()(),n(56,"blockquote",10)(57,"strong"),e(58,"Hint"),t(),e(59," The "),n(60,"code"),e(61,"ApolloServerOperationRegistry"),t(),e(62," plugin is exported from the "),n(63,"code"),e(64,"@apollo/server-plugin-operation-registry"),t(),e(65,` package.
`),t(),n(66,"h4",11)(67,"span"),e(68,"Plugins with Mercurius"),t()(),n(69,"p"),e(70,"Some of the existing mercurius-specific Fastify plugins must be loaded after the mercurius plugin (read more "),n(71,"a",12),e(72,"here"),t(),e(73,") on the plugin tree."),t(),n(74,"blockquote",13)(75,"strong"),e(76,"Warning"),t(),n(77,"a",14),e(78,"mercurius-upload"),t(),e(79,` is an exception and should be registered in the main file.
`),t(),n(80,"p"),e(81,"For this, "),n(82,"code"),e(83,"MercuriusDriver"),t(),e(84," exposes an optional "),n(85,"code"),e(86,"plugins"),t(),e(87," configuration option. It represents an array of objects that consist of two attributes: "),n(88,"code"),e(89,"plugin"),t(),e(90," and its "),n(91,"code"),e(92,"options"),t(),e(93,". Therefore, registering the "),n(94,"a",15),e(95,"cache plugin"),t(),e(96," would look like this:"),t(),n(97,"app-copy-button")(98,"pre")(99,"code",8),e(100,`
GraphQLModule.forRoot({
  driver: MercuriusDriver,
  // ...
  plugins: [
    {
      plugin: cache,
      options: {
        ttl: 10,
        policy: {
          Query: {
            add: true
          }
        }
      },
    }
  ]
}),
`),t()()()())},dependencies:[c,h],encapsulation:2,changeDetection:0})}return i})();var _=(()=>{class i{static \u0275fac=function(o){return new(o||i)};static \u0275cmp=s({type:i,selectors:[["app-banner-courses-graphql-cf"]],decls:25,vars:0,consts:[[1,"banner"],[1,"fas","fa-check"],["href","https://courses.nestjs.com/#graphql-bundle","target","_blank","title","Courses | NestJS - A node.js framework built on top of TypeScript",1,"btn-more"]],template:function(o,l){o&1&&(v(0,"div",0)(1,"h2"),e(2,"Learn the "),v(3,"span"),e(4,"right"),b(),e(5," way!"),b(),v(6,"ul")(7,"li")(8,"span"),C(9,"i",1),b(),e(10," 20+ chapters "),b(),v(11,"li")(12,"span"),C(13,"i",1),b(),e(14," GraphQL fundamentals "),b(),v(15,"li")(16,"span"),C(17,"i",1),b(),e(18," Official certificate "),b(),v(19,"li")(20,"span"),C(21,"i",1),b(),e(22," Deep-dive sessions "),b()(),v(23,"a",2),e(24,"Explore official GraphQL extensions"),b()())},styles:[".banner[_ngcontent-%COMP%]{background-color:#111;background-image:url(/assets/banners/courses-graphql-cf.jpg);background-position:center bottom}"],changeDetection:0})}return i})();var O=(()=>{class i extends p{static \u0275fac=(()=>{let r;return function(l){return(r||(r=d(i)))(l||i)}})();static \u0275cmp=s({type:i,selectors:[["app-quick-start"]],features:[m],decls:630,vars:0,consts:[["contentReference",""],["appbb381ac77daa6d46979b9f4881dd2ef300114979",""],["appf86fed7777961ec74f4ae096896e94098d03e2f9",""],["app07986a871d82d9a78cb7ca4958f34918f55ff2bc",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/graphql/quick-start.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","harnessing-the-power-of-typescript--graphql"],["rel","nofollow","target","_blank","href","https://graphql.org/"],["rel","nofollow","target","_blank","href","https://www.apollographql.com/blog/graphql-vs-rest"],["rel","nofollow","target","_blank","href","https://www.typescriptlang.org/"],["rel","nofollow","target","_blank","href","https://www.apollographql.com/"],["rel","nofollow","target","_blank","href","https://github.com/mercurius-js/mercurius"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/graphql/quick-start#third-party-integrations"],["href","/graphql/other-features#creating-a-custom-driver"],["appAnchor","","id","installation"],[1,"language-bash"],[1,"warning"],["rel","nofollow","target","_blank","href","https://www.apollographql.com/docs/apollo-server/migration/"],["appAnchor","","id","overview"],["appAnchor","","id","getting-started-with-graphql--typescript"],[1,"info"],["href","/graphql/quick-start#mercurius-integration"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],["rel","nofollow","target","_blank","href","https://www.apollographql.com/docs/apollo-server/api/apollo-server"],["rel","nofollow","target","_blank","href","https://github.com/mercurius-js/mercurius/blob/master/docs/api/options.md#plugin-options"],["appAnchor","","id","graphql-playground"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/23-graphql-code-first"],["routerLink","/graphql/resolvers-map"],["src","/assets/playground.png","alt",""],["rel","nofollow","target","_blank","href","https://github.com/graphql/graphiql"],["routerLink","/graphql/subscriptions"],["appAnchor","","id","code-first"],["appAnchor","","id","example"],["appAnchor","","id","schema-first"],["rel","nofollow","target","_blank","href","https://en.wikipedia.org/wiki/Abstract_syntax_tree"],["appAnchor","","id","apollo-sandbox"],["rel","nofollow","target","_blank","href","https://www.apollographql.com/blog/announcement/platform/apollo-sandbox-an-open-graphql-ide-for-local-development/"],["appAnchor","","id","example-1"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/12-graphql-schema-first"],["appAnchor","","id","accessing-generated-schema"],["appAnchor","","id","async-configuration"],["href","https://docs.nestjs.com/fundamentals/custom-providers#factory-providers-usefactory"],["appAnchor","","id","mercurius-integration"],["routerLink","/techniques/performance"],["appAnchor","","id","multiple-endpoints"],["appAnchor","","id","third-party-integrations"],["rel","nofollow","target","_blank","href","https://github.com/dotansimha/graphql-yoga"],["appAnchor","","id","example-2"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/33-graphql-mercurius"]],template:function(o,l){o&1&&(n(0,"div",4,0)(2,"div",5)(3,"a",6),a(4,"i",7),t()(),n(5,"h2",8),e(6,"Harnessing the power of TypeScript & GraphQL"),t(),n(7,"p")(8,"a",9),e(9,"GraphQL"),t(),e(10," is a powerful query language for APIs and a runtime for fulfilling those queries with your existing data. It's an elegant approach that solves many problems typically found with REST APIs. For background, we suggest reading this "),n(11,"a",10),e(12,"comparison"),t(),e(13," between GraphQL and REST. GraphQL combined with "),n(14,"a",11),e(15,"TypeScript"),t(),e(16," helps you develop better type safety with your GraphQL queries, giving you end-to-end typing."),t(),n(17,"p"),e(18,"In this chapter, we assume a basic understanding of GraphQL, and focus on how to work with the built-in "),n(19,"code"),e(20,"@nestjs/graphql"),t(),e(21," module. The "),n(22,"code"),e(23,"GraphQLModule"),t(),e(24," can be configured to use "),n(25,"a",12),e(26,"Apollo"),t(),e(27," server (with the "),n(28,"code"),e(29,"@nestjs/apollo"),t(),e(30," driver) and "),n(31,"a",13),e(32,"Mercurius"),t(),e(33," (with the "),n(34,"code"),e(35,"@nestjs/mercurius"),t(),e(36,"). We provide official integrations for these proven GraphQL packages to provide a simple way to use GraphQL with Nest (see more integrations "),n(37,"a",14),e(38,"here"),t(),e(39,")."),t(),n(40,"p"),e(41,"You can also build your own dedicated driver (read more on that "),n(42,"a",15),e(43,"here"),t(),e(44,")."),t(),n(45,"h4",16)(46,"span"),e(47,"Installation"),t()(),n(48,"p"),e(49,"Start by installing the required packages:"),t(),n(50,"pre")(51,"code",17),e(52,`
# For Express and Apollo (default)
$ npm i @nestjs/graphql @nestjs/apollo @apollo/server @as-integrations/express5 graphql

# For Fastify and Apollo
# npm i @nestjs/graphql @nestjs/apollo @apollo/server @as-integrations/fastify graphql

# For Fastify and Mercurius
# npm i @nestjs/graphql @nestjs/mercurius graphql mercurius
`),t()(),n(53,"blockquote",18)(54,"strong"),e(55,"Warning"),t(),n(56,"code"),e(57,"@nestjs/graphql@>=9"),t(),e(58," and "),n(59,"code"),e(60,"@nestjs/apollo^10"),t(),e(61," packages are compatible with "),n(62,"strong"),e(63,"Apollo v3"),t(),e(64," (check out Apollo Server 3 "),n(65,"a",19),e(66,"migration guide"),t(),e(67," for more details), while "),n(68,"code"),e(69,"@nestjs/graphql@^8"),t(),e(70," only supports "),n(71,"strong"),e(72,"Apollo v2"),t(),e(73," (e.g., "),n(74,"code"),e(75,"apollo-server-express@2.x.x"),t(),e(76,` package).
`),t(),n(77,"h4",20)(78,"span"),e(79,"Overview"),t()(),n(80,"p"),e(81,"Nest offers two ways of building GraphQL applications, the "),n(82,"strong"),e(83,"code first"),t(),e(84," and the "),n(85,"strong"),e(86,"schema first"),t(),e(87," methods. You should choose the one that works best for you. Most of the chapters in this GraphQL section are divided into two main parts: one you should follow if you adopt "),n(88,"strong"),e(89,"code first"),t(),e(90,", and the other to be used if you adopt "),n(91,"strong"),e(92,"schema first"),t(),e(93,"."),t(),n(94,"p"),e(95,"In the "),n(96,"strong"),e(97,"code first"),t(),e(98," approach, you use decorators and TypeScript classes to generate the corresponding GraphQL schema. This approach is useful if you prefer to work exclusively with TypeScript and avoid context switching between language syntaxes."),t(),n(99,"p"),e(100,"In the "),n(101,"strong"),e(102,"schema first"),t(),e(103," approach, the source of truth is GraphQL SDL (Schema Definition Language) files. SDL is a language-agnostic way to share schema files between different platforms. Nest automatically generates your TypeScript definitions (using either classes or interfaces) based on the GraphQL schemas to reduce the need to write redundant boilerplate code."),t(),n(104,"p"),a(105,"app-banner-courses-graphql-cf"),t(),n(106,"h4",21)(107,"span"),e(108,"Getting started with GraphQL & TypeScript"),t()(),n(109,"blockquote",22)(110,"strong"),e(111,"Hint"),t(),e(112," In the following chapters, we'll be integrating the "),n(113,"code"),e(114,"@nestjs/apollo"),t(),e(115," package. If you want to use "),n(116,"code"),e(117,"mercurius"),t(),e(118," package instead, navigate to "),n(119,"a",23),e(120,"this section"),t(),e(121,`.
`),t(),n(122,"p"),e(123,"Once the packages are installed, we can import the "),n(124,"code"),e(125,"GraphQLModule"),t(),e(126," and configure it with the "),n(127,"code"),e(128,"forRoot()"),t(),e(129," static method."),t(),n(130,"app-copy-button",24)(131,"span",25),a(132,"app-tabs",null,1),t(),n(134,"pre")(135,"code",26),e(136,`
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
    }),
  ],
})
export class AppModule {}
`),t()()(),n(137,"blockquote",22)(138,"strong"),e(139,"Hint"),t(),e(140," For "),n(141,"code"),e(142,"mercurius"),t(),e(143," integration, you should be using the "),n(144,"code"),e(145,"MercuriusDriver"),t(),e(146," and "),n(147,"code"),e(148,"MercuriusDriverConfig"),t(),e(149," instead. Both are exported from the "),n(150,"code"),e(151,"@nestjs/mercurius"),t(),e(152,` package.
`),t(),n(153,"p"),e(154,"The "),n(155,"code"),e(156,"forRoot()"),t(),e(157," method takes an options object as an argument. These options are passed through to the underlying driver instance (read more about available settings here: "),n(158,"a",27),e(159,"Apollo"),t(),e(160," and "),n(161,"a",28),e(162,"Mercurius"),t(),e(163,"). For example, if you want to disable the "),n(164,"code"),e(165,"playground"),t(),e(166," and turn off "),n(167,"code"),e(168,"debug"),t(),e(169," mode (for Apollo), pass the following options:"),t(),n(170,"app-copy-button",24)(171,"span",25),a(172,"app-tabs",null,2),t(),n(174,"pre")(175,"code",26),e(176,`
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: false,
    }),
  ],
})
export class AppModule {}
`),t()()(),n(177,"p"),e(178,"In this case, these options will be forwarded to the "),n(179,"code"),e(180,"ApolloServer"),t(),e(181," constructor."),t(),n(182,"h4",29)(183,"span"),e(184,"GraphQL playground"),t()(),n(185,"p"),e(186,"The playground is a graphical, interactive, in-browser GraphQL IDE, available by default on the same URL as the GraphQL server itself. To access the playground, you need a basic GraphQL server configured and running. To see it now, you can install and build the "),n(187,"a",30),e(188,"working example here"),t(),e(189,". Alternatively, if you're following along with these code samples, once you've completed the steps in the "),n(190,"a",31),e(191,"Resolvers chapter"),t(),e(192,", you can access the playground."),t(),n(193,"p"),e(194,"With that in place, and with your application running in the background, you can then open your web browser and navigate to "),n(195,"code"),e(196,"http://localhost:3000/graphql"),t(),e(197," (host and port may vary depending on your configuration). You will then see the GraphQL playground, as shown below."),t(),n(198,"figure"),a(199,"img",32),t(),n(200,"blockquote",22)(201,"strong"),e(202,"Note"),t(),n(203,"code"),e(204,"@nestjs/mercurius"),t(),e(205," integration does not ship with the built-in GraphQL Playground integration. Instead, you can use "),n(206,"a",33),e(207,"GraphiQL"),t(),e(208," (set "),n(209,"code"),e(210,"graphiql: true"),t(),e(211,`).
`),t(),n(212,"blockquote",18)(213,"strong"),e(214,"Warning"),t(),e(215," Update (04/14/2025): The default Apollo playground has been deprecated and will be removed in the next major release. Instead, you can use "),n(216,"a",33),e(217,"GraphiQL"),t(),e(218,", just set "),n(219,"code"),e(220,"graphiql: true"),t(),e(221," in the "),n(222,"code"),e(223,"GraphQLModule"),t(),e(224,` configuration, as shown below:
`),n(225,"app-copy-button")(226,"pre")(227,"code",26),e(228,`
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  graphiql: true,
}),
`),t()()(),n(229,"p"),e(230,"If your application uses "),n(231,"a",34),e(232,"subscriptions"),t(),e(233,", be sure to use "),n(234,"code"),e(235,"graphql-ws"),t(),e(236,", as "),n(237,"code"),e(238,"subscriptions-transport-ws"),t(),e(239," isn't supported by GraphiQL."),t()(),n(240,"h4",35)(241,"span"),e(242,"Code first"),t()(),n(243,"p"),e(244,"In the "),n(245,"strong"),e(246,"code first"),t(),e(247," approach, you use decorators and TypeScript classes to generate the corresponding GraphQL schema."),t(),n(248,"p"),e(249,"To use the code first approach, start by adding the "),n(250,"code"),e(251,"autoSchemaFile"),t(),e(252," property to the options object:"),t(),n(253,"app-copy-button")(254,"pre")(255,"code",26),e(256,`
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
}),
`),t()()(),n(257,"p"),e(258,"The "),n(259,"code"),e(260,"autoSchemaFile"),t(),e(261," property value is the path where your automatically generated schema will be created. Alternatively, the schema can be generated on-the-fly in memory. To enable this, set the "),n(262,"code"),e(263,"autoSchemaFile"),t(),e(264," property to "),n(265,"code"),e(266,"true"),t(),e(267,":"),t(),n(268,"app-copy-button")(269,"pre")(270,"code",26),e(271,`
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: true,
}),
`),t()()(),n(272,"p"),e(273,"By default, the types in the generated schema will be in the order they are defined in the included modules. To sort the schema lexicographically, set the "),n(274,"code"),e(275,"sortSchema"),t(),e(276," property to "),n(277,"code"),e(278,"true"),t(),e(279,":"),t(),n(280,"app-copy-button")(281,"pre")(282,"code",26),e(283,`
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
  sortSchema: true,
}),
`),t()()(),n(284,"h4",36)(285,"span"),e(286,"Example"),t()(),n(287,"p"),e(288,"A fully working code first sample is available "),n(289,"a",30),e(290,"here"),t(),e(291,"."),t(),n(292,"h4",37)(293,"span"),e(294,"Schema first"),t()(),n(295,"p"),e(296,"To use the schema first approach, start by adding a "),n(297,"code"),e(298,"typePaths"),t(),e(299," property to the options object. The "),n(300,"code"),e(301,"typePaths"),t(),e(302," property indicates where the "),n(303,"code"),e(304,"GraphQLModule"),t(),e(305," should look for GraphQL SDL schema definition files you'll be writing. These files will be combined in memory; this allows you to split your schemas into several files and locate them near their resolvers."),t(),n(306,"app-copy-button")(307,"pre")(308,"code",26),e(309,`
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  typePaths: ['./**/*.graphql'],
}),
`),t()()(),n(310,"p"),e(311,"You will typically also need to have TypeScript definitions (classes and interfaces) that correspond to the GraphQL SDL types. Creating the corresponding TypeScript definitions by hand is redundant and tedious. It leaves us without a single source of truth -- each change made within SDL forces us to adjust TypeScript definitions as well. To address this, the "),n(312,"code"),e(313,"@nestjs/graphql"),t(),e(314," package can "),n(315,"strong"),e(316,"automatically generate"),t(),e(317," TypeScript definitions from the abstract syntax tree ("),n(318,"a",38),e(319,"AST"),t(),e(320,"). To enable this feature, add the "),n(321,"code"),e(322,"definitions"),t(),e(323," options property when configuring the "),n(324,"code"),e(325,"GraphQLModule"),t(),e(326,"."),t(),n(327,"app-copy-button")(328,"pre")(329,"code",26),e(330,`
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  typePaths: ['./**/*.graphql'],
  definitions: {
    path: join(process.cwd(), 'src/graphql.ts'),
  },
}),
`),t()()(),n(331,"p"),e(332,"The path property of the "),n(333,"code"),e(334,"definitions"),t(),e(335," object indicates where to save generated TypeScript output. By default, all generated TypeScript types are created as interfaces. To generate classes instead, specify the "),n(336,"code"),e(337,"outputAs"),t(),e(338," property with a value of "),n(339,"code"),e(340,"'class'"),t(),e(341,"."),t(),n(342,"app-copy-button")(343,"pre")(344,"code",26),e(345,`
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  typePaths: ['./**/*.graphql'],
  definitions: {
    path: join(process.cwd(), 'src/graphql.ts'),
    outputAs: 'class',
  },
}),
`),t()()(),n(346,"p"),e(347,"The above approach dynamically generates TypeScript definitions each time the application starts. Alternatively, it may be preferable to build a simple script to generate these on demand. For example, assume we create the following script as "),n(348,"code"),e(349,"generate-typings.ts"),t(),e(350,":"),t(),n(351,"app-copy-button")(352,"pre")(353,"code",26),e(354,`
import { GraphQLDefinitionsFactory } from '@nestjs/graphql';
import { join } from 'node:path';

const definitionsFactory = new GraphQLDefinitionsFactory();
definitionsFactory.generate({
  typePaths: ['./src/**/*.graphql'],
  path: join(process.cwd(), 'src/graphql.ts'),
  outputAs: 'class',
});
`),t()()(),n(355,"p"),e(356,"Now you can run this script on demand:"),t(),n(357,"pre")(358,"code",17),e(359,`
$ ts-node generate-typings
`),t()(),n(360,"blockquote",22)(361,"strong"),e(362,"Hint"),t(),e(363," You can compile the script beforehand (e.g., with "),n(364,"code"),e(365,"tsc"),t(),e(366,") and use "),n(367,"code"),e(368,"node"),t(),e(369,` to execute it.
`),t(),n(370,"p"),e(371,"To enable watch mode for the script (to automatically generate typings whenever any "),n(372,"code"),e(373,".graphql"),t(),e(374," file changes), pass the "),n(375,"code"),e(376,"watch"),t(),e(377," option to the "),n(378,"code"),e(379,"generate()"),t(),e(380," method."),t(),n(381,"app-copy-button")(382,"pre")(383,"code",26),e(384,`
definitionsFactory.generate({
  typePaths: ['./src/**/*.graphql'],
  path: join(process.cwd(), 'src/graphql.ts'),
  outputAs: 'class',
  watch: true,
});
`),t()()(),n(385,"p"),e(386,"To automatically generate the additional "),n(387,"code"),e(388,"__typename"),t(),e(389," field for every object type, enable the "),n(390,"code"),e(391,"emitTypenameField"),t(),e(392," option:"),t(),n(393,"app-copy-button")(394,"pre")(395,"code",26),e(396,`
definitionsFactory.generate({
  // ...
  emitTypenameField: true,
});
`),t()()(),n(397,"p"),e(398,"To generate resolvers (queries, mutations, subscriptions) as plain fields without arguments, enable the "),n(399,"code"),e(400,"skipResolverArgs"),t(),e(401," option:"),t(),n(402,"app-copy-button")(403,"pre")(404,"code",26),e(405,`
definitionsFactory.generate({
  // ...
  skipResolverArgs: true,
});
`),t()()(),n(406,"p"),e(407,"To generate enums as TypeScript union types instead of regular TypeScript enums, set the "),n(408,"code"),e(409,"enumsAsTypes"),t(),e(410," option to "),n(411,"code"),e(412,"true"),t(),e(413,":"),t(),n(414,"app-copy-button")(415,"pre")(416,"code",26),e(417,`
definitionsFactory.generate({
  // ...
  enumsAsTypes: true,
});
`),t()()(),n(418,"h4",39)(419,"span"),e(420,"Apollo Sandbox"),t()(),n(421,"p"),e(422,"To use "),n(423,"a",40),e(424,"Apollo Sandbox"),t(),e(425," instead of the "),n(426,"code"),e(427,"graphql-playground"),t(),e(428," as a GraphQL IDE for local development, use the following configuration:"),t(),n(429,"app-copy-button")(430,"pre")(431,"code",26),e(432,`
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
    }),
  ],
})
export class AppModule {}
`),t()()(),n(433,"h4",41)(434,"span"),e(435,"Example"),t()(),n(436,"p"),e(437,"A fully working schema first sample is available "),n(438,"a",42),e(439,"here"),t(),e(440,"."),t(),n(441,"h4",43)(442,"span"),e(443,"Accessing generated schema"),t()(),n(444,"p"),e(445,"In some circumstances (for example end-to-end tests), you may want to get a reference to the generated schema object. In end-to-end tests, you can then run queries using the "),n(446,"code"),e(447,"graphql"),t(),e(448," object without using any HTTP listeners."),t(),n(449,"p"),e(450,"You can access the generated schema (in either the code first or schema first approach), using the "),n(451,"code"),e(452,"GraphQLSchemaHost"),t(),e(453," class:"),t(),n(454,"app-copy-button")(455,"pre")(456,"code",26),e(457,`
const { schema } = app.get(GraphQLSchemaHost);
`),t()()(),n(458,"blockquote",22)(459,"strong"),e(460,"Hint"),t(),e(461," You must call the "),n(462,"code"),e(463,"GraphQLSchemaHost#schema"),t(),e(464," getter after the application has been initialized (after the "),n(465,"code"),e(466,"onModuleInit"),t(),e(467," hook has been triggered by either the "),n(468,"code"),e(469,"app.listen()"),t(),e(470," or "),n(471,"code"),e(472,"app.init()"),t(),e(473,` method).
`),t(),n(474,"h4",44)(475,"span"),e(476,"Async configuration"),t()(),n(477,"p"),e(478,"When you need to pass module options asynchronously instead of statically, use the "),n(479,"code"),e(480,"forRootAsync()"),t(),e(481," method. As with most dynamic modules, Nest provides several techniques to deal with async configuration."),t(),n(482,"p"),e(483,"One technique is to use a factory function:"),t(),n(484,"app-copy-button")(485,"pre")(486,"code",26),e(487,`
 GraphQLModule.forRootAsync<ApolloDriverConfig>({
  driver: ApolloDriver,
  useFactory: () => ({
    typePaths: ['./**/*.graphql'],
  }),
}),
`),t()()(),n(488,"p"),e(489,"Like other factory providers, our factory function can be "),n(490,"a",45),e(491,"async"),t(),e(492," and can inject dependencies through "),n(493,"code"),e(494,"inject"),t(),e(495,"."),t(),n(496,"app-copy-button")(497,"pre")(498,"code",26),e(499,`
GraphQLModule.forRootAsync<ApolloDriverConfig>({
  driver: ApolloDriver,
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    typePaths: configService.get<string>('GRAPHQL_TYPE_PATHS'),
  }),
  inject: [ConfigService],
}),
`),t()()(),n(500,"p"),e(501,"Alternatively, you can configure the "),n(502,"code"),e(503,"GraphQLModule"),t(),e(504," using a class instead of a factory, as shown below:"),t(),n(505,"app-copy-button")(506,"pre")(507,"code",26),e(508,`
GraphQLModule.forRootAsync<ApolloDriverConfig>({
  driver: ApolloDriver,
  useClass: GqlConfigService,
}),
`),t()()(),n(509,"p"),e(510,"The construction above instantiates "),n(511,"code"),e(512,"GqlConfigService"),t(),e(513," inside "),n(514,"code"),e(515,"GraphQLModule"),t(),e(516,", using it to create options object. Note that in this example, the "),n(517,"code"),e(518,"GqlConfigService"),t(),e(519," has to implement the "),n(520,"code"),e(521,"GqlOptionsFactory"),t(),e(522," interface, as shown below. The "),n(523,"code"),e(524,"GraphQLModule"),t(),e(525," will call the "),n(526,"code"),e(527,"createGqlOptions()"),t(),e(528," method on the instantiated object of the supplied class."),t(),n(529,"app-copy-button")(530,"pre")(531,"code",26),e(532,`
@Injectable()
class GqlConfigService implements GqlOptionsFactory {
  createGqlOptions(): ApolloDriverConfig {
    return {
      typePaths: ['./**/*.graphql'],
    };
  }
}
`),t()()(),n(533,"p"),e(534,"If you want to reuse an existing options provider instead of creating a private copy inside the "),n(535,"code"),e(536,"GraphQLModule"),t(),e(537,", use the "),n(538,"code"),e(539,"useExisting"),t(),e(540," syntax."),t(),n(541,"app-copy-button")(542,"pre")(543,"code",26),e(544,`
GraphQLModule.forRootAsync<ApolloDriverConfig>({
  imports: [ConfigModule],
  useExisting: ConfigService,
}),
`),t()()(),n(545,"h4",46)(546,"span"),e(547,"Mercurius integration"),t()(),n(548,"p"),e(549,"Instead of using Apollo, Fastify users (read more "),n(550,"a",47),e(551,"here"),t(),e(552,") can alternatively use the "),n(553,"code"),e(554,"@nestjs/mercurius"),t(),e(555," driver."),t(),n(556,"app-copy-button",24)(557,"span",25),a(558,"app-tabs",null,3),t(),n(560,"pre")(561,"code",26),e(562,`
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriver, MercuriusDriverConfig } from '@nestjs/mercurius';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      graphiql: true,
    }),
  ],
})
export class AppModule {}
`),t()()(),n(563,"blockquote",22)(564,"strong"),e(565,"Hint"),t(),e(566," Once the application is running, open your browser and navigate to "),n(567,"code"),e(568,"http://localhost:3000/graphiql"),t(),e(569,". You should see the "),n(570,"a",33),e(571,"GraphQL IDE"),t(),e(572,`.
`),t(),n(573,"p"),e(574,"The "),n(575,"code"),e(576,"forRoot()"),t(),e(577," method takes an options object as an argument. These options are passed through to the underlying driver instance. Read more about available settings "),n(578,"a",28),e(579,"here"),t(),e(580,"."),t(),n(581,"h4",48)(582,"span"),e(583,"Multiple endpoints"),t()(),n(584,"p"),e(585,"Another useful feature of the "),n(586,"code"),e(587,"@nestjs/graphql"),t(),e(588," module is the ability to serve multiple endpoints at once. This lets you decide which modules should be included in which endpoint. By default, "),n(589,"code"),e(590,"GraphQL"),t(),e(591," searches for resolvers throughout the whole app. To limit this scan to only a subset of modules, use the "),n(592,"code"),e(593,"include"),t(),e(594," property."),t(),n(595,"app-copy-button")(596,"pre")(597,"code",26),e(598,`
GraphQLModule.forRoot({
  include: [CatsModule],
}),
`),t()()(),n(599,"blockquote",18)(600,"strong"),e(601,"Warning"),t(),e(602," If you use the "),n(603,"code"),e(604,"@apollo/server"),t(),e(605," with "),n(606,"code"),e(607,"@as-integrations/fastify"),t(),e(608," package with multiple GraphQL endpoints in a single application, make sure to enable the "),n(609,"code"),e(610,"disableHealthCheck"),t(),e(611," setting in the "),n(612,"code"),e(613,"GraphQLModule"),t(),e(614,` configuration.
`),t(),n(615,"h4",49)(616,"span"),e(617,"Third-party integrations"),t()(),n(618,"ul")(619,"li")(620,"a",50),e(621,"GraphQL Yoga"),t()()(),n(622,"h4",51)(623,"span"),e(624,"Example"),t()(),n(625,"p"),e(626,"A working example is available "),n(627,"a",52),e(628,"here"),t(),e(629,"."),t()())},dependencies:[c,_,h,A,x],encapsulation:2,changeDetection:0})}return i})();var H=(()=>{class i extends p{static \u0275fac=(()=>{let r;return function(l){return(r||(r=d(i)))(l||i)}})();static \u0275cmp=s({type:i,selectors:[["app-resolvers-map"]],features:[m],decls:1126,vars:40,consts:[["contentReference",""],["app293f58072e71186d2118ea50dd56cd794922468a",""],["app518fe7c05095ec9b436ad3a95ce625b3200a416d",""],["app5389a97729a5ee8b38125ca7d20943936d9a2750",""],["app5ec21b60eae57cd6058e2d250697e7542972b31b",""],["appecc6240adfb13bc37ce64959a218d017b54e1d09",""],["app9cefa8a6707602073ca2403449820396d3a7e734",""],["app1b3d85741347ee6417b2b371c32bf4b27fd16b6b",""],["app051c75b52ae10ee940c654ff0d3a0fbe98f38924",""],["appe247cf48d9fd01a88175e52f13c7cc6f82f1fd65",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/graphql/resolvers-map.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","resolvers"],["rel","nofollow","target","_blank","href","https://graphql.org/"],["appAnchor","","id","code-first"],["appAnchor","","id","object-types"],[1,"language-graphql"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],[1,"info"],["routerLink","/graphql/cli-plugin"],["rel","nofollow","target","_blank","href","https://graphql.org/learn/schema/"],["routerLink","/graphql/scalars"],["appAnchor","","id","code-first-resolver"],["href","/graphql/resolvers#module"],[1,"warning"],["routerLink","/recipes/crud-generator"],["appAnchor","","id","query-type-names"],["rel","nofollow","target","_blank","href","https://graphql.org/learn/queries/"],["appAnchor","","id","query-decorator-options"],["appAnchor","","id","args-decorator-options"],["href","/controllers#route-parameters"],["appAnchor","","id","dedicated-arguments-class"],["routerLink","/techniques/validation"],["appAnchor","","id","class-inheritance"],["appAnchor","","id","generics"],["rel","nofollow","target","_blank","href","https://graphql.org/learn/pagination/#pagination-and-edges"],["appAnchor","","id","schema-first"],["routerLink","/graphql/quick-start"],["rel","nofollow","target","_blank","href","https://graphql.org/learn/schema/#type-language"],["appAnchor","","id","schema-first-resolver"],["appAnchor","","id","generating-types"],["routerLink","/pipes"],["appAnchor","","id","graphql-argument-decorators"],["appAnchor","","id","module"],["routerLink","/cli/overview"]],template:function(o,l){if(o&1&&(n(0,"div",10,0)(2,"div",11)(3,"a",12),a(4,"i",13),t()(),n(5,"h3",14),e(6,"Resolvers"),t(),n(7,"p"),e(8,"Resolvers provide the instructions for turning a "),n(9,"a",15),e(10,"GraphQL"),t(),e(11," operation (a query, mutation, or subscription) into data. They return the same shape of data we specify in our schema -- either synchronously or as a promise that resolves to a result of that shape. Typically, you create a "),n(12,"strong"),e(13,"resolver map"),t(),e(14," manually. The "),n(15,"code"),e(16,"@nestjs/graphql"),t(),e(17," package, on the other hand, generates a resolver map automatically using the metadata provided by the decorators you use to annotate classes. To demonstrate the process of using the package features to create a GraphQL API, we'll create a simple authors API."),t(),n(18,"h4",16)(19,"span"),e(20,"Code first"),t()(),n(21,"p"),e(22,"In the code-first approach, we don't follow the typical process of creating our GraphQL schema by writing GraphQL SDL by hand. Instead, we use TypeScript decorators to generate the SDL from TypeScript class definitions. The "),n(23,"code"),e(24,"@nestjs/graphql"),t(),e(25," package reads the metadata defined through the decorators and automatically generates the schema for you."),t(),n(26,"h4",17)(27,"span"),e(28,"Object types"),t()(),n(29,"p"),e(30,"Most of the definitions in a GraphQL schema are "),n(31,"strong"),e(32,"object types"),t(),e(33,". Each object type you define should represent a domain object that an application client might need to interact with. For example, our sample API needs to be able to fetch a list of authors and their posts, so we should define the "),n(34,"code"),e(35,"Author"),t(),e(36," type and "),n(37,"code"),e(38,"Post"),t(),e(39," type to support this functionality."),t(),n(40,"p"),e(41,"If we were using the schema-first approach, we'd define such a schema with SDL like this:"),t(),n(42,"pre")(43,"code",18),e(44,`
type Author {
  id: Int!
  firstName: String
  lastName: String
  posts: [Post!]!
}
`),t()(),n(45,"p"),e(46,"In this case, using the code first approach, we define schemas using TypeScript classes and using TypeScript decorators to annotate the fields of those classes. The equivalent of the above SDL in the code first approach is:"),t(),n(47,"app-copy-button",19)(48,"span",20),e(49),E(50,"extension"),a(51,"app-tabs",null,1),t(),n(53,"pre")(54,"code",21),e(55,`
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Post } from './post';

@ObjectType()
export class Author {
  @Field(type => Int)
  id: number;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field(type => [Post])
  posts: Post[];
}
`),t()()(),n(56,"blockquote",22)(57,"strong"),e(58,"Hint"),t(),e(59," TypeScript's metadata reflection system has several limitations which make it impossible, for instance, to determine what properties a class consists of or recognize whether a given property is optional or required. Because of these limitations, we must either explicitly use the "),n(60,"code"),e(61,"@Field()"),t(),e(62," decorator in our schema definition classes to provide metadata about each field's GraphQL type and optionality, or use a "),n(63,"a",23),e(64,"CLI plugin"),t(),e(65,` to generate these for us.
`),t(),n(66,"p"),e(67,"The "),n(68,"code"),e(69,"Author"),t(),e(70," object type, like any class, is made of a collection of fields, with each field declaring a type. A field's type corresponds to a "),n(71,"a",24),e(72,"GraphQL type"),t(),e(73,". A field's GraphQL type can be either another object type or a scalar type. A GraphQL scalar type is a primitive (like "),n(74,"code"),e(75,"ID"),t(),e(76,", "),n(77,"code"),e(78,"String"),t(),e(79,", "),n(80,"code"),e(81,"Boolean"),t(),e(82,", or "),n(83,"code"),e(84,"Int"),t(),e(85,") that resolves to a single value."),t(),n(86,"blockquote",22)(87,"strong"),e(88,"Hint"),t(),e(89," In addition to GraphQL's built-in scalar types, you can define custom scalar types (read "),n(90,"a",25),e(91,"more"),t(),e(92,`).
`),t(),n(93,"p"),e(94,"The above "),n(95,"code"),e(96,"Author"),t(),e(97," object type definition will cause Nest to "),n(98,"strong"),e(99,"generate"),t(),e(100," the SDL we showed above:"),t(),n(101,"pre")(102,"code",18),e(103,`
type Author {
  id: Int!
  firstName: String
  lastName: String
  posts: [Post!]!
}
`),t()(),n(104,"p"),e(105,"The "),n(106,"code"),e(107,"@Field()"),t(),e(108," decorator accepts an optional type function (e.g., "),n(109,"code"),e(110,"type => Int"),t(),e(111,"), and optionally an options object."),t(),n(112,"p"),e(113,"The type function is required when there's the potential for ambiguity between the TypeScript type system and the GraphQL type system. Specifically: it is "),n(114,"strong"),e(115,"not"),t(),e(116," required for "),n(117,"code"),e(118,"string"),t(),e(119," and "),n(120,"code"),e(121,"boolean"),t(),e(122," types; it "),n(123,"strong"),e(124,"is"),t(),e(125," required for "),n(126,"code"),e(127,"number"),t(),e(128," (which must be mapped to either a GraphQL "),n(129,"code"),e(130,"Int"),t(),e(131," or "),n(132,"code"),e(133,"Float"),t(),e(134,"). The type function should simply return the desired GraphQL type (as shown in various examples in these chapters)."),t(),n(135,"p"),e(136,"The options object can have any of the following key/value pairs:"),t(),n(137,"ul")(138,"li")(139,"code"),e(140,"nullable"),t(),e(141,": for specifying whether a field is nullable (in "),n(142,"code"),e(143,"@nestjs/graphql"),t(),e(144,", each field is non-nullable by default); "),n(145,"code"),e(146,"boolean"),t()(),n(147,"li")(148,"code"),e(149,"description"),t(),e(150,": for setting a field description; "),n(151,"code"),e(152,"string"),t()(),n(153,"li")(154,"code"),e(155,"deprecationReason"),t(),e(156,": for marking a field as deprecated; "),n(157,"code"),e(158,"string"),t()()(),n(159,"p"),e(160,"For example:"),t(),n(161,"app-copy-button")(162,"pre")(163,"code",21),e(164,`
@Field({ description: \`Book title\`, deprecationReason: 'Not useful in v2 schema' })
title: string;
`),t()()(),n(165,"blockquote",22)(166,"strong"),e(167,"Hint"),t(),e(168," You can also add a description to, or deprecate, the whole object type: "),n(169,"code"),e(170),t(),e(171,`.
`),t(),n(172,"p"),e(173,"When the field is an array, we must manually indicate the array type in the "),n(174,"code"),e(175,"Field()"),t(),e(176," decorator's type function, as shown below:"),t(),n(177,"app-copy-button")(178,"pre")(179,"code",21),e(180,`
@Field(type => [Post])
posts: Post[];
`),t()()(),n(181,"blockquote",22)(182,"strong"),e(183,"Hint"),t(),e(184," Using array bracket notation ("),n(185,"code"),e(186,"[ ]"),t(),e(187,"), we can indicate the depth of the array. For example, using "),n(188,"code"),e(189,"[[Int]]"),t(),e(190,` would represent an integer matrix.
`),t(),n(191,"p"),e(192,"To declare that an array's items (not the array itself) are nullable, set the "),n(193,"code"),e(194,"nullable"),t(),e(195," property to "),n(196,"code"),e(197,"'items'"),t(),e(198," as shown below:"),t(),n(199,"app-copy-button")(200,"pre")(201,"code",21),e(202,`
@Field(type => [Post], { nullable: 'items' })
posts: Post[];
`),t()()(),n(203,"blockquote",22)(204,"strong"),e(205,"Hint"),t(),e(206," If both the array and its items are nullable, set "),n(207,"code"),e(208,"nullable"),t(),e(209," to "),n(210,"code"),e(211,"'itemsAndList'"),t(),e(212,` instead.
`),t(),n(213,"p"),e(214,"Now that the "),n(215,"code"),e(216,"Author"),t(),e(217," object type is created, let's define the "),n(218,"code"),e(219,"Post"),t(),e(220," object type."),t(),n(221,"app-copy-button",19)(222,"span",20),e(223),E(224,"extension"),a(225,"app-tabs",null,2),t(),n(227,"pre")(228,"code",21),e(229,`
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Post {
  @Field(type => Int)
  id: number;

  @Field()
  title: string;

  @Field(type => Int, { nullable: true })
  votes?: number;
}
`),t()()(),n(230,"p"),e(231,"The "),n(232,"code"),e(233,"Post"),t(),e(234," object type will result in generating the following part of the GraphQL schema in SDL:"),t(),n(235,"pre")(236,"code",18),e(237,`
type Post {
  id: Int!
  title: String!
  votes: Int
}
`),t()(),n(238,"h4",26)(239,"span"),e(240,"Code first resolver"),t()(),n(241,"p"),e(242,"At this point, we've defined the objects (type definitions) that can exist in our data graph, but clients don't yet have a way to interact with those objects. To address that, we need to create a resolver class. In the code first method, a resolver class both defines resolver functions "),n(243,"strong"),e(244,"and"),t(),e(245," generates the "),n(246,"strong"),e(247,"Query type"),t(),e(248,". This will be clear as we work through the example below:"),t(),n(249,"app-copy-button",19)(250,"span",20),e(251),E(252,"extension"),a(253,"app-tabs",null,3),t(),n(255,"pre")(256,"code",21),e(257,`
@Resolver(() => Author)
export class AuthorsResolver {
  constructor(
    private authorsService: AuthorsService,
    private postsService: PostsService,
  ) {}

  @Query(() => Author)
  async author(@Args('id', { type: () => Int }) id: number) {
    return this.authorsService.findOneById(id);
  }

  @ResolveField()
  async posts(@Parent() author: Author) {
    const { id } = author;
    return this.postsService.findAll({ authorId: id });
  }
}
`),t()()(),n(258,"blockquote",22)(259,"strong"),e(260,"Hint"),t(),e(261," All decorators (e.g., "),n(262,"code"),e(263,"@Resolver"),t(),e(264,", "),n(265,"code"),e(266,"@ResolveField"),t(),e(267,", "),n(268,"code"),e(269,"@Args"),t(),e(270,", etc.) are exported from the "),n(271,"code"),e(272,"@nestjs/graphql"),t(),e(273,` package.
`),t(),n(274,"p"),e(275,"You can define multiple resolver classes. Nest will combine these at run time. See the "),n(276,"a",27),e(277,"module"),t(),e(278," section below for more on code organization."),t(),n(279,"blockquote",28)(280,"strong"),e(281,"Note"),t(),e(282," The logic inside the "),n(283,"code"),e(284,"AuthorsService"),t(),e(285," and "),n(286,"code"),e(287,"PostsService"),t(),e(288,` classes can be as simple or sophisticated as needed. The main point of this example is to show how to construct resolvers and how they can interact with other providers.
`),t(),n(289,"p"),e(290,"In the example above, we created the "),n(291,"code"),e(292,"AuthorsResolver"),t(),e(293,", which defines one query resolver function and one field resolver function. To create a resolver, we create a class with resolver functions as methods, and annotate the class with the "),n(294,"code"),e(295,"@Resolver()"),t(),e(296," decorator."),t(),n(297,"p"),e(298,"In this example, we defined a query handler to get the author object based on the "),n(299,"code"),e(300,"id"),t(),e(301," sent in the request. To specify that the method is a query handler, use the "),n(302,"code"),e(303,"@Query()"),t(),e(304," decorator."),t(),n(305,"p"),e(306,"The argument passed to the "),n(307,"code"),e(308,"@Resolver()"),t(),e(309," decorator is optional, but comes into play when our graph becomes non-trivial. It's used to supply a parent object used by field resolver functions as they traverse down through an object graph."),t(),n(310,"p"),e(311,"In our example, since the class includes a "),n(312,"strong"),e(313,"field resolver"),t(),e(314," function (for the "),n(315,"code"),e(316,"posts"),t(),e(317," property of the "),n(318,"code"),e(319,"Author"),t(),e(320," object type), we "),n(321,"strong"),e(322,"must"),t(),e(323," supply the "),n(324,"code"),e(325,"@Resolver()"),t(),e(326," decorator with a value to indicate which class is the parent type (i.e., the corresponding "),n(327,"code"),e(328,"ObjectType"),t(),e(329," class name) for all field resolvers defined within this class. As should be clear from the example, when writing a field resolver function, it's necessary to access the parent object (the object the field being resolved is a member of). In this example, we populate an author's posts array with a field resolver that calls a service that takes the author's "),n(330,"code"),e(331,"id"),t(),e(332," as an argument. Hence, the need to identify the parent object in the "),n(333,"code"),e(334,"@Resolver()"),t(),e(335," decorator. Note the corresponding use of the "),n(336,"code"),e(337,"@Parent()"),t(),e(338," method parameter decorator to then extract a reference to that parent object in the field resolver."),t(),n(339,"p"),e(340,"We can define multiple "),n(341,"code"),e(342,"@Query()"),t(),e(343," resolver functions (both within this class and in any other resolver class), and they will be aggregated into a single "),n(344,"strong"),e(345,"Query type"),t(),e(346," definition in the generated SDL along with the appropriate entries in the resolver map. This allows you to define queries close to the models and services that they use, and to keep them well organized in modules."),t(),n(347,"blockquote",22)(348,"strong"),e(349,"Hint"),t(),e(350," Nest CLI provides a generator (schematic) that automatically generates "),n(351,"strong"),e(352,"all the boilerplate code"),t(),e(353," to help us avoid doing all of this, and make the developer experience much simpler. Read more about this feature "),n(354,"a",29),e(355,"here"),t(),e(356,`.
`),t(),n(357,"h4",30)(358,"span"),e(359,"Query type names"),t()(),n(360,"p"),e(361,"In the above examples, the "),n(362,"code"),e(363,"@Query()"),t(),e(364," decorator generates a GraphQL schema query type name based on the method name. For example, consider the following construction from the example above:"),t(),n(365,"app-copy-button")(366,"pre")(367,"code",21),e(368,`
@Query(() => Author)
async author(@Args('id', { type: () => Int }) id: number) {
  return this.authorsService.findOneById(id);
}
`),t()()(),n(369,"p"),e(370,"This generates the following entry for the author query in our schema (the query type uses the same name as the method name):"),t(),n(371,"pre")(372,"code",18),e(373,`
type Query {
  author(id: Int!): Author
}
`),t()(),n(374,"blockquote",22)(375,"strong"),e(376,"Hint"),t(),e(377," Learn more about GraphQL queries "),n(378,"a",31),e(379,"here"),t(),e(380,`.
`),t(),n(381,"p"),e(382,"Conventionally, we prefer to decouple these names; for example, we prefer to use a name like "),n(383,"code"),e(384,"getAuthor()"),t(),e(385," for our query handler method, but still use "),n(386,"code"),e(387,"author"),t(),e(388," for our query type name. The same applies to our field resolvers. We can easily do this by passing the mapping names as arguments of the "),n(389,"code"),e(390,"@Query()"),t(),e(391," and "),n(392,"code"),e(393,"@ResolveField()"),t(),e(394," decorators, as shown below:"),t(),n(395,"app-copy-button",19)(396,"span",20),e(397),E(398,"extension"),a(399,"app-tabs",null,4),t(),n(401,"pre")(402,"code",21),e(403,`
@Resolver(() => Author)
export class AuthorsResolver {
  constructor(
    private authorsService: AuthorsService,
    private postsService: PostsService,
  ) {}

  @Query(() => Author, { name: 'author' })
  async getAuthor(@Args('id', { type: () => Int }) id: number) {
    return this.authorsService.findOneById(id);
  }

  @ResolveField('posts', () => [Post])
  async getPosts(@Parent() author: Author) {
    const { id } = author;
    return this.postsService.findAll({ authorId: id });
  }
}
`),t()()(),n(404,"p"),e(405,"The "),n(406,"code"),e(407,"getAuthor"),t(),e(408," handler method above will result in generating the following part of the GraphQL schema in SDL:"),t(),n(409,"pre")(410,"code",18),e(411,`
type Query {
  author(id: Int!): Author
}
`),t()(),n(412,"h4",32)(413,"span"),e(414,"Query decorator options"),t()(),n(415,"p"),e(416,"The "),n(417,"code"),e(418,"@Query()"),t(),e(419," decorator's options object (where we pass "),n(420,"code"),e(421),t(),e(422," above) accepts a number of key/value pairs:"),t(),n(423,"ul")(424,"li")(425,"code"),e(426,"name"),t(),e(427,": name of the query; a "),n(428,"code"),e(429,"string"),t()(),n(430,"li")(431,"code"),e(432,"description"),t(),e(433,": a description that will be used to generate GraphQL schema documentation (e.g., in GraphQL playground); a "),n(434,"code"),e(435,"string"),t()(),n(436,"li")(437,"code"),e(438,"deprecationReason"),t(),e(439,": sets query metadata to show the query as deprecated (e.g., in GraphQL playground); a "),n(440,"code"),e(441,"string"),t()(),n(442,"li")(443,"code"),e(444,"nullable"),t(),e(445,": whether the query can return a null data response; "),n(446,"code"),e(447,"boolean"),t(),e(448," or "),n(449,"code"),e(450,"'items'"),t(),e(451," or "),n(452,"code"),e(453,"'itemsAndList'"),t(),e(454," (see above for details of "),n(455,"code"),e(456,"'items'"),t(),e(457," and "),n(458,"code"),e(459,"'itemsAndList'"),t(),e(460,")"),t()(),n(461,"h4",33)(462,"span"),e(463,"Args decorator options"),t()(),n(464,"p"),e(465,"Use the "),n(466,"code"),e(467,"@Args()"),t(),e(468," decorator to extract arguments from a request for use in the method handler. This works in a very similar fashion to "),n(469,"a",34),e(470,"REST route parameter argument extraction"),t(),e(471,"."),t(),n(472,"p"),e(473,"Usually, your "),n(474,"code"),e(475,"@Args()"),t(),e(476," decorator will be simple and not require an object argument, as seen with the "),n(477,"code"),e(478,"getAuthor()"),t(),e(479," method above. For example, if the type of an identifier is string, the following construction is sufficient, and simply plucks the named field from the inbound GraphQL request for use as a method argument."),t(),n(480,"app-copy-button")(481,"pre")(482,"code",21),e(483,`
@Args('id') id: string
`),t()()(),n(484,"p"),e(485,"In the "),n(486,"code"),e(487,"getAuthor()"),t(),e(488," case, the "),n(489,"code"),e(490,"number"),t(),e(491," type is used, which presents a challenge. The "),n(492,"code"),e(493,"number"),t(),e(494," TypeScript type doesn't give us enough information about the expected GraphQL representation (e.g., "),n(495,"code"),e(496,"Int"),t(),e(497," vs. "),n(498,"code"),e(499,"Float"),t(),e(500,"). Thus, we have to "),n(501,"strong"),e(502,"explicitly"),t(),e(503," pass the type reference. We do that by passing a second argument to the "),n(504,"code"),e(505,"Args()"),t(),e(506," decorator, containing argument options, as shown below:"),t(),n(507,"app-copy-button")(508,"pre")(509,"code",21),e(510,`
@Query(() => Author, { name: 'author' })
async getAuthor(@Args('id', { type: () => Int }) id: number) {
  return this.authorsService.findOneById(id);
}
`),t()()(),n(511,"p"),e(512,"The options object allows us to specify the following optional key-value pairs:"),t(),n(513,"ul")(514,"li")(515,"code"),e(516,"type"),t(),e(517,": a function returning the GraphQL type"),t(),n(518,"li")(519,"code"),e(520,"defaultValue"),t(),e(521,": a default value; "),n(522,"code"),e(523,"any"),t()(),n(524,"li")(525,"code"),e(526,"description"),t(),e(527,": description metadata; "),n(528,"code"),e(529,"string"),t()(),n(530,"li")(531,"code"),e(532,"deprecationReason"),t(),e(533,": to deprecate a field and provide metadata describing why; "),n(534,"code"),e(535,"string"),t()(),n(536,"li")(537,"code"),e(538,"nullable"),t(),e(539,": whether the field is nullable"),t()(),n(540,"p"),e(541,"Query handler methods can take multiple arguments. Let's imagine that we want to fetch an author based on its "),n(542,"code"),e(543,"firstName"),t(),e(544," and "),n(545,"code"),e(546,"lastName"),t(),e(547,". In this case, we can call "),n(548,"code"),e(549,"@Args"),t(),e(550," twice:"),t(),n(551,"app-copy-button")(552,"pre")(553,"code",21),e(554,`
getAuthor(
  @Args('firstName', { nullable: true }) firstName?: string,
  @Args('lastName', { defaultValue: '' }) lastName?: string,
) {}
`),t()()(),n(555,"blockquote",22)(556,"strong"),e(557,"Hint"),t(),e(558," In the case of "),n(559,"code"),e(560,"firstName"),t(),e(561,", which is a GraphQL nullable field, it isn't necessary to add the non-value types of "),n(562,"code"),e(563,"null"),t(),e(564," or "),n(565,"code"),e(566,"undefined"),t(),e(567,` to the type of this field. Just be aware, you'll need to type guard for these possible non-value types in your resolvers, because a GraphQL nullable field will allow those types to pass through to your resolver.
`),t(),n(568,"h4",35)(569,"span"),e(570,"Dedicated arguments class"),t()(),n(571,"p"),e(572,"With inline "),n(573,"code"),e(574,"@Args()"),t(),e(575," calls, code like the example above becomes bloated. Instead, you can create a dedicated "),n(576,"code"),e(577,"GetAuthorArgs"),t(),e(578," arguments class and access it in the handler method as follows:"),t(),n(579,"app-copy-button")(580,"pre")(581,"code",21),e(582,`
@Args() args: GetAuthorArgs
`),t()()(),n(583,"p"),e(584,"Create the "),n(585,"code"),e(586,"GetAuthorArgs"),t(),e(587," class using "),n(588,"code"),e(589,"@ArgsType()"),t(),e(590," as shown below:"),t(),n(591,"app-copy-button",19)(592,"span",20),e(593),E(594,"extension"),a(595,"app-tabs",null,5),t(),n(597,"pre")(598,"code",21),e(599,`
import { MinLength } from 'class-validator';
import { Field, ArgsType } from '@nestjs/graphql';

@ArgsType()
class GetAuthorArgs {
  @Field({ nullable: true })
  firstName?: string;

  @Field({ defaultValue: '' })
  @MinLength(3)
  lastName: string;
}
`),t()()(),n(600,"blockquote",22)(601,"strong"),e(602,"Hint"),t(),e(603," Again, due to TypeScript's metadata reflection system limitations, it's required to either use the "),n(604,"code"),e(605,"@Field"),t(),e(606," decorator to manually indicate type and optionality, or use a "),n(607,"a",23),e(608,"CLI plugin"),t(),e(609,". Also, in the case of "),n(610,"code"),e(611,"firstName"),t(),e(612,", which is a GraphQL nullable field, it isn't necessary to add the non-value types of "),n(613,"code"),e(614,"null"),t(),e(615," or "),n(616,"code"),e(617,"undefined"),t(),e(618," to the type of this field. Just be aware, you'll need to type guard for these possible non-value types in your resolvers, because a GraphQL nullable field will allow those types to pass through to your resolver. "),t(),n(619,"p"),e(620,"This will result in generating the following part of the GraphQL schema in SDL:"),t(),n(621,"pre")(622,"code",18),e(623,`
type Query {
  author(firstName: String, lastName: String = ''): Author
}
`),t()(),n(624,"blockquote",22)(625,"strong"),e(626,"Hint"),t(),e(627," Note that argument classes like "),n(628,"code"),e(629,"GetAuthorArgs"),t(),e(630," play very well with the "),n(631,"code"),e(632,"ValidationPipe"),t(),e(633," (read "),n(634,"a",36),e(635,"more"),t(),e(636,`).
`),t(),n(637,"h4",37)(638,"span"),e(639,"Class inheritance"),t()(),n(640,"p"),e(641,"You can use standard TypeScript class inheritance to create base classes with generic utility type features (fields and field properties, validations, etc.) that can be extended. For example, you may have a set of pagination related arguments that always include the standard "),n(642,"code"),e(643,"offset"),t(),e(644," and "),n(645,"code"),e(646,"limit"),t(),e(647," fields, but also other index fields that are type-specific. You can set up a class hierarchy as shown below."),t(),n(648,"p"),e(649,"Base "),n(650,"code"),e(651,"@ArgsType()"),t(),e(652," class:"),t(),n(653,"app-copy-button")(654,"pre")(655,"code",21),e(656,`
@ArgsType()
class PaginationArgs {
  @Field(() => Int)
  offset: number = 0;

  @Field(() => Int)
  limit: number = 10;
}
`),t()()(),n(657,"p"),e(658,"Type specific sub-class of the base "),n(659,"code"),e(660,"@ArgsType()"),t(),e(661," class:"),t(),n(662,"app-copy-button")(663,"pre")(664,"code",21),e(665,`
@ArgsType()
class GetAuthorArgs extends PaginationArgs {
  @Field({ nullable: true })
  firstName?: string;

  @Field({ defaultValue: '' })
  @MinLength(3)
  lastName: string;
}
`),t()()(),n(666,"p"),e(667,"The same approach can be taken with "),n(668,"code"),e(669,"@ObjectType()"),t(),e(670," objects. Define generic properties on the base class:"),t(),n(671,"app-copy-button")(672,"pre")(673,"code",21),e(674,`
@ObjectType()
class Character {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;
}
`),t()()(),n(675,"p"),e(676,"Add type-specific properties on sub-classes:"),t(),n(677,"app-copy-button")(678,"pre")(679,"code",21),e(680,`
@ObjectType()
class Warrior extends Character {
  @Field()
  level: number;
}
`),t()()(),n(681,"p"),e(682,"You can use inheritance with a resolver as well. You can ensure type safety by combining inheritance and TypeScript generics. For example, to create a base class with a generic "),n(683,"code"),e(684,"findAll"),t(),e(685," query, use a construction like this:"),t(),n(686,"app-copy-button")(687,"pre")(688,"code",21),e(689,`
function BaseResolver<T extends Type<unknown>>(classRef: T): any {
  @Resolver({ isAbstract: true })
  abstract class BaseResolverHost {
    @Query(() => [classRef], { name: \`findAll\${classRef.name}\` })
    async findAll(): Promise<T[]> {
      return [];
    }
  }
  return BaseResolverHost;
}
`),t()()(),n(690,"p"),e(691,"Note the following:"),t(),n(692,"ul")(693,"li"),e(694,"An explicit return type ("),n(695,"code"),e(696,"any"),t(),e(697," above) is required; otherwise, TypeScript complains about the usage of a private class definition. Recommended: define an interface instead of using "),n(698,"code"),e(699,"any"),t(),e(700,"."),t(),n(701,"li")(702,"code"),e(703,"Type"),t(),e(704," is imported from the "),n(705,"code"),e(706,"@nestjs/common"),t(),e(707," package"),t(),n(708,"li"),e(709,"The "),n(710,"code"),e(711,"isAbstract: true"),t(),e(712," property indicates that SDL (Schema Definition Language statements) shouldn't be generated for this class. Note, you can set this property for other types as well to suppress SDL generation."),t()(),n(713,"p"),e(714,"Here's how you could generate a concrete subclass of the "),n(715,"code"),e(716,"BaseResolver"),t(),e(717,":"),t(),n(718,"app-copy-button")(719,"pre")(720,"code",21),e(721,`
@Resolver(() => Recipe)
export class RecipesResolver extends BaseResolver(Recipe) {
  constructor(private recipesService: RecipesService) {
    super();
  }
}
`),t()()(),n(722,"p"),e(723,"This construct would generate the following SDL:"),t(),n(724,"pre")(725,"code",18),e(726,`
type Query {
  findAllRecipe: [Recipe!]!
}
`),t()(),n(727,"h4",38)(728,"span"),e(729,"Generics"),t()(),n(730,"p"),e(731,"We saw one use of generics above. This powerful TypeScript feature can be used to create useful abstractions. For example, here's a sample cursor-based pagination implementation based on "),n(732,"a",39),e(733,"this documentation"),t(),e(734,":"),t(),n(735,"app-copy-button")(736,"pre")(737,"code",21),e(738,`
import { Field, ObjectType, Int } from '@nestjs/graphql';
import { Type } from '@nestjs/common';

interface IEdgeType<T> {
  cursor: string;
  node: T;
}

export interface IPaginatedType<T> {
  edges: IEdgeType<T>[];
  nodes: T[];
  totalCount: number;
  hasNextPage: boolean;
}

export function Paginated<T>(classRef: Type<T>): Type<IPaginatedType<T>> {
  @ObjectType(\`\${classRef.name}Edge\`)
  abstract class EdgeType {
    @Field(() => String)
    cursor: string;

    @Field(() => classRef)
    node: T;
  }

  @ObjectType({ isAbstract: true })
  abstract class PaginatedType implements IPaginatedType<T> {
    @Field(() => [EdgeType], { nullable: true })
    edges: EdgeType[];

    @Field(() => [classRef], { nullable: true })
    nodes: T[];

    @Field(() => Int)
    totalCount: number;

    @Field()
    hasNextPage: boolean;
  }
  return PaginatedType as Type<IPaginatedType<T>>;
}
`),t()()(),n(739,"p"),e(740,"With the above base class defined, we can now easily create specialized types that inherit this behavior. For example:"),t(),n(741,"app-copy-button")(742,"pre")(743,"code",21),e(744,`
@ObjectType()
class PaginatedAuthor extends Paginated(Author) {}
`),t()()(),n(745,"h4",40)(746,"span"),e(747,"Schema first"),t()(),n(748,"p"),e(749,"As mentioned in the "),n(750,"a",41),e(751,"previous"),t(),e(752," chapter, in the schema-first approach, we start by manually defining schema types in SDL (read "),n(753,"a",42),e(754,"more"),t(),e(755,"). Consider the following SDL type definitions."),t(),n(756,"blockquote",22)(757,"strong"),e(758,"Hint"),t(),e(759," For convenience in this chapter, we've aggregated all of the SDL in one location (e.g., one "),n(760,"code"),e(761,".graphql"),t(),e(762,` file, as shown below). In practice, you may find it appropriate to organize your code in a modular fashion. For example, it can be helpful to create individual SDL files with type definitions representing each domain entity, along with related services, resolver code, and the Nest module definition class, in a dedicated directory for that entity. Nest will aggregate all the individual schema type definitions at run time.
`),t(),n(763,"pre")(764,"code",18),e(765,`
type Author {
  id: Int!
  firstName: String
  lastName: String
  posts: [Post]
}

type Post {
  id: Int!
  title: String!
  votes: Int
}

type Query {
  author(id: Int!): Author
}
`),t()(),n(766,"h4",43)(767,"span"),e(768,"Schema first resolver"),t()(),n(769,"p"),e(770,"The schema above exposes a single query - "),n(771,"code"),e(772,"author(id: Int!): Author"),t(),e(773,"."),t(),n(774,"blockquote",22)(775,"strong"),e(776,"Hint"),t(),e(777," Learn more about GraphQL queries "),n(778,"a",31),e(779,"here"),t(),e(780,`.
`),t(),n(781,"p"),e(782,"Let's now create an "),n(783,"code"),e(784,"AuthorsResolver"),t(),e(785," class that resolves author queries:"),t(),n(786,"app-copy-button",19)(787,"span",20),e(788),E(789,"extension"),a(790,"app-tabs",null,6),t(),n(792,"pre")(793,"code",21),e(794,`
@Resolver('Author')
export class AuthorsResolver {
  constructor(
    private authorsService: AuthorsService,
    private postsService: PostsService,
  ) {}

  @Query()
  async author(@Args('id') id: number) {
    return this.authorsService.findOneById(id);
  }

  @ResolveField()
  async posts(@Parent() author) {
    const { id } = author;
    return this.postsService.findAll({ authorId: id });
  }
}
`),t()()(),n(795,"blockquote",22)(796,"strong"),e(797,"Hint"),t(),e(798," All decorators (e.g., "),n(799,"code"),e(800,"@Resolver"),t(),e(801,", "),n(802,"code"),e(803,"@ResolveField"),t(),e(804,", "),n(805,"code"),e(806,"@Args"),t(),e(807,", etc.) are exported from the "),n(808,"code"),e(809,"@nestjs/graphql"),t(),e(810,` package.
`),t(),n(811,"blockquote",28)(812,"strong"),e(813,"Note"),t(),e(814," The logic inside the "),n(815,"code"),e(816,"AuthorsService"),t(),e(817," and "),n(818,"code"),e(819,"PostsService"),t(),e(820,` classes can be as simple or sophisticated as needed. The main point of this example is to show how to construct resolvers and how they can interact with other providers.
`),t(),n(821,"p"),e(822,"The "),n(823,"code"),e(824,"@Resolver()"),t(),e(825," decorator is required. It takes an optional string argument with the name of a class. This class name is required whenever the class includes "),n(826,"code"),e(827,"@ResolveField()"),t(),e(828," decorators to inform Nest that the decorated method is associated with a parent type (the "),n(829,"code"),e(830,"Author"),t(),e(831," type in our current example). Alternatively, instead of setting "),n(832,"code"),e(833,"@Resolver()"),t(),e(834," at the top of the class, this can be done for each method:"),t(),n(835,"app-copy-button")(836,"pre")(837,"code",21),e(838,`
@Resolver('Author')
@ResolveField()
async posts(@Parent() author) {
  const { id } = author;
  return this.postsService.findAll({ authorId: id });
}
`),t()()(),n(839,"p"),e(840,"In this case ("),n(841,"code"),e(842,"@Resolver()"),t(),e(843," decorator at the method level), if you have multiple "),n(844,"code"),e(845,"@ResolveField()"),t(),e(846," decorators inside a class, you must add "),n(847,"code"),e(848,"@Resolver()"),t(),e(849," to all of them. This is not considered the best practice (as it creates extra overhead)."),t(),n(850,"blockquote",22)(851,"strong"),e(852,"Hint"),t(),e(853," Any class name argument passed to "),n(854,"code"),e(855,"@Resolver()"),t(),n(856,"strong"),e(857,"does not"),t(),e(858," affect queries ("),n(859,"code"),e(860,"@Query()"),t(),e(861," decorator) or mutations ("),n(862,"code"),e(863,"@Mutation()"),t(),e(864,` decorator).
`),t(),n(865,"blockquote",28)(866,"strong"),e(867,"Warning"),t(),e(868," Using the "),n(869,"code"),e(870,"@Resolver"),t(),e(871," decorator at the method level is not supported with the "),n(872,"strong"),e(873,"code first"),t(),e(874,` approach.
`),t(),n(875,"p"),e(876,"In the above examples, the "),n(877,"code"),e(878,"@Query()"),t(),e(879," and "),n(880,"code"),e(881,"@ResolveField()"),t(),e(882," decorators are associated with GraphQL schema types based on the method name. For example, consider the following construction from the example above:"),t(),n(883,"app-copy-button")(884,"pre")(885,"code",21),e(886,`
@Query()
async author(@Args('id') id: number) {
  return this.authorsService.findOneById(id);
}
`),t()()(),n(887,"p"),e(888,"This generates the following entry for the author query in our schema (the query type uses the same name as the method name):"),t(),n(889,"pre")(890,"code",18),e(891,`
type Query {
  author(id: Int!): Author
}
`),t()(),n(892,"p"),e(893,"Conventionally, we would prefer to decouple these, using names like "),n(894,"code"),e(895,"getAuthor()"),t(),e(896," or "),n(897,"code"),e(898,"getPosts()"),t(),e(899," for our resolver methods. We can easily do this by passing the mapping name as an argument to the decorator, as shown below:"),t(),n(900,"app-copy-button",19)(901,"span",20),e(902),E(903,"extension"),a(904,"app-tabs",null,7),t(),n(906,"pre")(907,"code",21),e(908,`
@Resolver('Author')
export class AuthorsResolver {
  constructor(
    private authorsService: AuthorsService,
    private postsService: PostsService,
  ) {}

  @Query('author')
  async getAuthor(@Args('id') id: number) {
    return this.authorsService.findOneById(id);
  }

  @ResolveField('posts')
  async getPosts(@Parent() author) {
    const { id } = author;
    return this.postsService.findAll({ authorId: id });
  }
}
`),t()()(),n(909,"blockquote",22)(910,"strong"),e(911,"Hint"),t(),e(912," Nest CLI provides a generator (schematic) that automatically generates "),n(913,"strong"),e(914,"all the boilerplate code"),t(),e(915," to help us avoid doing all of this, and make the developer experience much simpler. Read more about this feature "),n(916,"a",29),e(917,"here"),t(),e(918,`.
`),t(),n(919,"h4",44)(920,"span"),e(921,"Generating types"),t()(),n(922,"p"),e(923,"Assuming that we use the schema first approach and have enabled the typings generation feature (with "),n(924,"code"),e(925,"outputAs: 'class'"),t(),e(926," as shown in the "),n(927,"a",41),e(928,"previous"),t(),e(929," chapter), once you run the application, it will generate the following file (in the location you specified in the "),n(930,"code"),e(931,"GraphQLModule.forRoot()"),t(),e(932," method). For example, in "),n(933,"code"),e(934,"src/graphql.ts"),t(),e(935,":"),t(),n(936,"app-copy-button",19)(937,"span",20),e(938),E(939,"extension"),a(940,"app-tabs",null,8),t(),n(942,"pre")(943,"code",21),e(944,`
export class Author {
  id: number;
  firstName?: string;
  lastName?: string;
  posts?: Post[];
}
export class Post {
  id: number;
  title: string;
  votes?: number;
}

export abstract class IQuery {
  abstract author(id: number): Author | Promise<Author>;
}
`),t()()(),n(945,"p"),e(946,"By generating classes (instead of the default technique of generating interfaces), you can use declarative validation "),n(947,"strong"),e(948,"decorators"),t(),e(949," in combination with the schema first approach, which is an extremely useful technique (read "),n(950,"a",36),e(951,"more"),t(),e(952,"). For example, you could add "),n(953,"code"),e(954,"class-validator"),t(),e(955," decorators to the generated "),n(956,"code"),e(957,"CreatePostInput"),t(),e(958," class as shown below to enforce minimum and maximum string lengths on the "),n(959,"code"),e(960,"title"),t(),e(961," field:"),t(),n(962,"app-copy-button")(963,"pre")(964,"code",21),e(965,`
import { MinLength, MaxLength } from 'class-validator';

export class CreatePostInput {
  @MinLength(3)
  @MaxLength(50)
  title: string;
}
`),t()()(),n(966,"blockquote",28)(967,"strong"),e(968,"Notice"),t(),e(969," To enable auto-validation of your inputs (and parameters), use "),n(970,"code"),e(971,"ValidationPipe"),t(),e(972,". Read more about validation "),n(973,"a",36),e(974,"here"),t(),e(975," and more specifically about pipes "),n(976,"a",45),e(977,"here"),t(),e(978,`.
`),t(),n(979,"p"),e(980,"However, if you add decorators directly to the automatically generated file, they will be "),n(981,"strong"),e(982,"overwritten"),t(),e(983," each time the file is generated. Instead, create a separate file and simply extend the generated class."),t(),n(984,"app-copy-button")(985,"pre")(986,"code",21),e(987,`
import { MinLength, MaxLength } from 'class-validator';
import { Post } from '../../graphql.ts';

export class CreatePostInput extends Post {
  @MinLength(3)
  @MaxLength(50)
  title: string;
}
`),t()()(),n(988,"h4",46)(989,"span"),e(990,"GraphQL argument decorators"),t()(),n(991,"p"),e(992,"We can access the standard GraphQL resolver arguments using dedicated decorators. Below is a comparison of the Nest decorators and the plain Apollo parameters they represent."),t(),n(993,"table")(994,"tbody")(995,"tr")(996,"td")(997,"code"),e(998,"@Root()"),t(),e(999," and "),n(1e3,"code"),e(1001,"@Parent()"),t()(),n(1002,"td")(1003,"code"),e(1004,"root"),t(),e(1005,"/"),n(1006,"code"),e(1007,"parent"),t()()(),n(1008,"tr")(1009,"td")(1010,"code"),e(1011,"@Context(param?: string)"),t()(),n(1012,"td")(1013,"code"),e(1014,"context"),t(),e(1015," / "),n(1016,"code"),e(1017,"context[param]"),t()()(),n(1018,"tr")(1019,"td")(1020,"code"),e(1021,"@Info(param?: string)"),t()(),n(1022,"td")(1023,"code"),e(1024,"info"),t(),e(1025," / "),n(1026,"code"),e(1027,"info[param]"),t()()(),n(1028,"tr")(1029,"td")(1030,"code"),e(1031,"@Args(param?: string)"),t()(),n(1032,"td")(1033,"code"),e(1034,"args"),t(),e(1035," / "),n(1036,"code"),e(1037,"args[param]"),t()()()()(),n(1038,"p"),e(1039,"These arguments have the following meanings:"),t(),n(1040,"ul")(1041,"li")(1042,"code"),e(1043,"root"),t(),e(1044,": an object that contains the result returned from the resolver on the parent field, or, in the case of a top-level "),n(1045,"code"),e(1046,"Query"),t(),e(1047," field, the "),n(1048,"code"),e(1049,"rootValue"),t(),e(1050," passed from the server configuration."),t(),n(1051,"li")(1052,"code"),e(1053,"context"),t(),e(1054,": an object shared by all resolvers in a particular query; typically used to contain per-request state."),t(),n(1055,"li")(1056,"code"),e(1057,"info"),t(),e(1058,": an object that contains information about the execution state of the query."),t(),n(1059,"li")(1060,"code"),e(1061,"args"),t(),e(1062,": an object with the arguments passed into the field in the query."),t()(),n(1063,"p"),a(1064,"app-banner-devtools"),t(),n(1065,"h4",47)(1066,"span"),e(1067,"Module"),t()(),n(1068,"p"),e(1069,"Once we're done with the above steps, we have declaratively specified all the information needed by the "),n(1070,"code"),e(1071,"GraphQLModule"),t(),e(1072," to generate a resolver map. The "),n(1073,"code"),e(1074,"GraphQLModule"),t(),e(1075," uses reflection to introspect the meta data provided via the decorators, and transforms classes into the correct resolver map automatically."),t(),n(1076,"p"),e(1077,"The only other thing you need to take care of is to "),n(1078,"strong"),e(1079,"provide"),t(),e(1080," (i.e., list as a "),n(1081,"code"),e(1082,"provider"),t(),e(1083," in some module) the resolver class(es) ("),n(1084,"code"),e(1085,"AuthorsResolver"),t(),e(1086,"), and importing the module ("),n(1087,"code"),e(1088,"AuthorsModule"),t(),e(1089,") somewhere, so Nest will be able to utilize it."),t(),n(1090,"p"),e(1091,"For example, we can do this in an "),n(1092,"code"),e(1093,"AuthorsModule"),t(),e(1094,", which can also provide other services needed in this context. Be sure to import "),n(1095,"code"),e(1096,"AuthorsModule"),t(),e(1097," somewhere (e.g., in the root module, or some other module imported by the root module)."),t(),n(1098,"app-copy-button",19)(1099,"span",20),e(1100),E(1101,"extension"),a(1102,"app-tabs",null,9),t(),n(1104,"pre")(1105,"code",21),e(1106,`
@Module({
  imports: [PostsModule],
  providers: [AuthorsService, AuthorsResolver],
})
export class AuthorsModule {}
`),t()()(),n(1107,"blockquote",22)(1108,"strong"),e(1109,"Hint"),t(),e(1110," It is helpful to organize your code by your so-called "),n(1111,"strong"),e(1112,"domain model"),t(),e(1113," (similar to the way you would organize entry points in a REST API). In this approach, keep your models ("),n(1114,"code"),e(1115,"ObjectType"),t(),e(1116," classes), resolvers and services together within a Nest module representing the domain model. Keep all of these components in a single folder per module. When you do this, and use the "),n(1117,"a",48),e(1118,"Nest CLI"),t(),e(1119," to generate each element, Nest will wire all of these parts together (locating files in appropriate folders, generating entries in "),n(1120,"code"),e(1121,"provider"),t(),e(1122," and "),n(1123,"code"),e(1124,"imports"),t(),e(1125,` arrays, etc.) automatically for you.
`),t()()),o&2){let q=g(52),k=g(226),V=g(254),K=g(400),X=g(596),Z=g(791),ee=g(905),te=g(941),ne=g(1103);u(49),S(" ",y(50,13,"authors/models/author.model",q.isJsActive),`
`),u(121),w("@ObjectType(","{"," description: 'Author model' ","}",")"),u(53),S(" ",y(224,16,"posts/models/post.model",k.isJsActive),`
`),u(28),S(" ",y(252,19,"authors/authors.resolver",V.isJsActive),`
`),u(146),S(" ",y(398,22,"authors/authors.resolver",K.isJsActive),`
`),u(24),w("","{","name: 'author'","}"),u(172),S(" ",y(594,25,"authors/dto/get-author.args",X.isJsActive),`
`),u(195),S(" ",y(789,28,"authors/authors.resolver",Z.isJsActive),`
`),u(114),S(" ",y(903,31,"authors/authors.resolver",ee.isJsActive),`
`),u(36),S(" ",y(939,34,"graphql",te.isJsActive),`
`),u(162),S(" ",y(1101,37,"authors/authors.module",ne.isJsActive),`
`)}},dependencies:[c,h,A,x,D,T],encapsulation:2,changeDetection:0})}return i})();var W=(()=>{class i extends p{static \u0275fac=(()=>{let r;return function(l){return(r||(r=d(i)))(l||i)}})();static \u0275cmp=s({type:i,selectors:[["app-scalars"]],features:[m],decls:360,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/graphql/scalars.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","scalars"],["rel","nofollow","target","_blank","href","https://graphql.org/learn/schema/#scalar-types"],["appAnchor","","id","code-first"],[1,"language-typescript"],["appAnchor","","id","override-a-default-scalar"],["appAnchor","","id","import-a-custom-scalar"],[1,"language-bash"],["rel","nofollow","target","_blank","href","https://www.npmjs.com/package/graphql-scalars"],["appAnchor","","id","create-a-custom-scalar"],["appAnchor","","id","schema-first"],["rel","nofollow","target","_blank","href","https://www.apollographql.com/docs/graphql-tools/scalars.html"],[1,"language-graphql"],[1,"info"],["rel","nofollow","target","_blank","href","https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-0.html#new-unknown-top-type"],["rel","nofollow","target","_blank","href","https://github.com/Microsoft/TypeScript/issues/12525#issuecomment-263166239"]],template:function(o,l){o&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),a(4,"i",4),t()(),n(5,"h3",5),e(6,"Scalars"),t(),n(7,"p"),e(8,"A GraphQL object type has a name and fields, but at some point those fields have to resolve to some concrete data. That's where the scalar types come in: they represent the leaves of the query (read more "),n(9,"a",6),e(10,"here"),t(),e(11,"). GraphQL includes the following default types: "),n(12,"code"),e(13,"Int"),t(),e(14,", "),n(15,"code"),e(16,"Float"),t(),e(17,", "),n(18,"code"),e(19,"String"),t(),e(20,", "),n(21,"code"),e(22,"Boolean"),t(),e(23," and "),n(24,"code"),e(25,"ID"),t(),e(26,". In addition to these built-in types, you may need to support custom atomic data types (e.g., "),n(27,"code"),e(28,"Date"),t(),e(29,")."),t(),n(30,"h4",7)(31,"span"),e(32,"Code first"),t()(),n(33,"p"),e(34,"The code-first approach ships with five scalars in which three of them are simple aliases for the existing GraphQL types."),t(),n(35,"ul")(36,"li")(37,"code"),e(38,"ID"),t(),e(39," (alias for "),n(40,"code"),e(41,"GraphQLID"),t(),e(42,") - represents a unique identifier, often used to refetch an object or as the key for a cache"),t(),n(43,"li")(44,"code"),e(45,"Int"),t(),e(46," (alias for "),n(47,"code"),e(48,"GraphQLInt"),t(),e(49,") - a signed 32\u2010bit integer"),t(),n(50,"li")(51,"code"),e(52,"Float"),t(),e(53," (alias for "),n(54,"code"),e(55,"GraphQLFloat"),t(),e(56,") - a signed double-precision floating-point value"),t(),n(57,"li")(58,"code"),e(59,"GraphQLISODateTime"),t(),e(60," - a date-time string at UTC (used by default to represent "),n(61,"code"),e(62,"Date"),t(),e(63," type)"),t(),n(64,"li")(65,"code"),e(66,"GraphQLTimestamp"),t(),e(67," - a signed integer which represents date and time as number of milliseconds from start of UNIX epoch"),t()(),n(68,"p"),e(69,"The "),n(70,"code"),e(71,"GraphQLISODateTime"),t(),e(72," (e.g. "),n(73,"code"),e(74,"2019-12-03T09:54:33Z"),t(),e(75,") is used by default to represent the "),n(76,"code"),e(77,"Date"),t(),e(78," type. To use the "),n(79,"code"),e(80,"GraphQLTimestamp"),t(),e(81," instead, set the "),n(82,"code"),e(83,"dateScalarMode"),t(),e(84," of the "),n(85,"code"),e(86,"buildSchemaOptions"),t(),e(87," object to "),n(88,"code"),e(89,"'timestamp'"),t(),e(90," as follows:"),t(),n(91,"app-copy-button")(92,"pre")(93,"code",8),e(94,`
GraphQLModule.forRoot({
  buildSchemaOptions: {
    dateScalarMode: 'timestamp',
  }
}),
`),t()()(),n(95,"p"),e(96,"Likewise, the "),n(97,"code"),e(98,"GraphQLFloat"),t(),e(99," is used by default to represent the "),n(100,"code"),e(101,"number"),t(),e(102," type. To use the "),n(103,"code"),e(104,"GraphQLInt"),t(),e(105," instead, set the "),n(106,"code"),e(107,"numberScalarMode"),t(),e(108," of the "),n(109,"code"),e(110,"buildSchemaOptions"),t(),e(111," object to "),n(112,"code"),e(113,"'integer'"),t(),e(114," as follows:"),t(),n(115,"app-copy-button")(116,"pre")(117,"code",8),e(118,`
GraphQLModule.forRoot({
  buildSchemaOptions: {
    numberScalarMode: 'integer',
  }
}),
`),t()()(),n(119,"p"),e(120,"In addition, you can create custom scalars."),t(),n(121,"h4",9)(122,"span"),e(123,"Override a default scalar"),t()(),n(124,"p"),e(125,"To create a custom implementation for the "),n(126,"code"),e(127,"Date"),t(),e(128," scalar, simply create a new class."),t(),n(129,"app-copy-button")(130,"pre")(131,"code",8),e(132,`
import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('Date', () => Date)
export class DateScalar implements CustomScalar<number, Date> {
  description = 'Date custom scalar type';

  parseValue(value: number): Date {
    return new Date(value); // value from the client
  }

  serialize(value: Date): number {
    return value.getTime(); // value sent to the client
  }

  parseLiteral(ast: ValueNode): Date {
    if (ast.kind === Kind.INT) {
      return new Date(ast.value);
    }
    return null;
  }
}
`),t()()(),n(133,"p"),e(134,"With this in place, register "),n(135,"code"),e(136,"DateScalar"),t(),e(137," as a provider."),t(),n(138,"app-copy-button")(139,"pre")(140,"code",8),e(141,`
@Module({
  providers: [DateScalar],
})
export class CommonModule {}
`),t()()(),n(142,"p"),e(143,"Now we can use the "),n(144,"code"),e(145,"Date"),t(),e(146," type in our classes."),t(),n(147,"app-copy-button")(148,"pre")(149,"code",8),e(150,`
@Field()
creationDate: Date;
`),t()()(),n(151,"h4",10)(152,"span"),e(153,"Import a custom scalar"),t()(),n(154,"p"),e(155,"To use a custom scalar, import and register it as a resolver. We\u2019ll use the "),n(156,"code"),e(157,"graphql-type-json"),t(),e(158," package for demonstration purposes. This npm package defines a "),n(159,"code"),e(160,"JSON"),t(),e(161," GraphQL scalar type."),t(),n(162,"p"),e(163,"Start by installing the package:"),t(),n(164,"pre")(165,"code",11),e(166,`
$ npm i --save graphql-type-json
`),t()(),n(167,"p"),e(168,"Once the package is installed, we pass a custom resolver to the "),n(169,"code"),e(170,"forRoot()"),t(),e(171," method:"),t(),n(172,"app-copy-button")(173,"pre")(174,"code",8),e(175,`
import GraphQLJSON from 'graphql-type-json';

@Module({
  imports: [
    GraphQLModule.forRoot({
      resolvers: { JSON: GraphQLJSON },
    }),
  ],
})
export class AppModule {}
`),t()()(),n(176,"p"),e(177,"Now we can use the "),n(178,"code"),e(179,"JSON"),t(),e(180," type in our classes."),t(),n(181,"app-copy-button")(182,"pre")(183,"code",8),e(184,`
@Field(() => GraphQLJSON)
info: JSON;
`),t()()(),n(185,"p"),e(186,"For a suite of useful scalars, take a look at the "),n(187,"a",12),e(188,"graphql-scalars"),t(),e(189," package."),t(),n(190,"h4",13)(191,"span"),e(192,"Create a custom scalar"),t()(),n(193,"p"),e(194,"To define a custom scalar, create a new "),n(195,"code"),e(196,"GraphQLScalarType"),t(),e(197," instance. We'll create a custom "),n(198,"code"),e(199,"UUID"),t(),e(200," scalar."),t(),n(201,"app-copy-button")(202,"pre")(203,"code",8),e(204,`
const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validate(uuid: unknown): string | never {
  if (typeof uuid !== 'string' || !regex.test(uuid)) {
    throw new Error('invalid uuid');
  }
  return uuid;
}

export const CustomUuidScalar = new GraphQLScalarType({
  name: 'UUID',
  description: 'A simple UUID parser',
  serialize: (value) => validate(value),
  parseValue: (value) => validate(value),
  parseLiteral: (ast) => validate(ast.value),
});
`),t()()(),n(205,"p"),e(206,"We pass a custom resolver to the "),n(207,"code"),e(208,"forRoot()"),t(),e(209," method:"),t(),n(210,"app-copy-button")(211,"pre")(212,"code",8),e(213,`
@Module({
  imports: [
    GraphQLModule.forRoot({
      resolvers: { UUID: CustomUuidScalar },
    }),
  ],
})
export class AppModule {}
`),t()()(),n(214,"p"),e(215,"Now we can use the "),n(216,"code"),e(217,"UUID"),t(),e(218," type in our classes."),t(),n(219,"app-copy-button")(220,"pre")(221,"code",8),e(222,`
@Field(() => CustomUuidScalar)
uuid: string;
`),t()()(),n(223,"h4",14)(224,"span"),e(225,"Schema first"),t()(),n(226,"p"),e(227,"To define a custom scalar (read more about scalars "),n(228,"a",15),e(229,"here"),t(),e(230,"), create a type definition and a dedicated resolver. Here (as in the official documentation), we\u2019ll use the "),n(231,"code"),e(232,"graphql-type-json"),t(),e(233," package for demonstration purposes. This npm package defines a "),n(234,"code"),e(235,"JSON"),t(),e(236," GraphQL scalar type."),t(),n(237,"p"),e(238,"Start by installing the package:"),t(),n(239,"pre")(240,"code",11),e(241,`
$ npm i --save graphql-type-json
`),t()(),n(242,"p"),e(243,"Once the package is installed, we pass a custom resolver to the "),n(244,"code"),e(245,"forRoot()"),t(),e(246," method:"),t(),n(247,"app-copy-button")(248,"pre")(249,"code",8),e(250,`
import GraphQLJSON from 'graphql-type-json';

@Module({
  imports: [
    GraphQLModule.forRoot({
      typePaths: ['./**/*.graphql'],
      resolvers: { JSON: GraphQLJSON },
    }),
  ],
})
export class AppModule {}
`),t()()(),n(251,"p"),e(252,"Now we can use the "),n(253,"code"),e(254,"JSON"),t(),e(255," scalar in our type definitions:"),t(),n(256,"pre")(257,"code",16),e(258,`
scalar JSON

type Foo {
  field: JSON
}
`),t()(),n(259,"p"),e(260,"Another method to define a scalar type is to create a simple class. Assume we want to enhance our schema with the "),n(261,"code"),e(262,"Date"),t(),e(263," type."),t(),n(264,"app-copy-button")(265,"pre")(266,"code",8),e(267,`
import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('Date')
export class DateScalar implements CustomScalar<number, Date> {
  description = 'Date custom scalar type';

  parseValue(value: number): Date {
    return new Date(value); // value from the client
  }

  serialize(value: Date): number {
    return value.getTime(); // value sent to the client
  }

  parseLiteral(ast: ValueNode): Date {
    if (ast.kind === Kind.INT) {
      return new Date(ast.value);
    }
    return null;
  }
}
`),t()()(),n(268,"p"),e(269,"With this in place, register "),n(270,"code"),e(271,"DateScalar"),t(),e(272," as a provider."),t(),n(273,"app-copy-button")(274,"pre")(275,"code",8),e(276,`
@Module({
  providers: [DateScalar],
})
export class CommonModule {}
`),t()()(),n(277,"p"),e(278,"Now we can use the "),n(279,"code"),e(280,"Date"),t(),e(281," scalar in type definitions."),t(),n(282,"pre")(283,"code",16),e(284,`
scalar Date
`),t()(),n(285,"p"),e(286,"By default, the generated TypeScript definition for all scalars is "),n(287,"code"),e(288,"any"),t(),e(289,` - which isn't particularly typesafe.
But, you can configure how Nest generates typings for your custom scalars when you specify how to generate types:`),t(),n(290,"app-copy-button")(291,"pre")(292,"code",8),e(293,`
import { GraphQLDefinitionsFactory } from '@nestjs/graphql';
import { join } from 'path';

const definitionsFactory = new GraphQLDefinitionsFactory();

definitionsFactory.generate({
  typePaths: ['./src/**/*.graphql'],
  path: join(process.cwd(), 'src/graphql.ts'),
  outputAs: 'class',
  defaultScalarType: 'unknown',
  customScalarTypeMapping: {
    DateTime: 'Date',
    BigNumber: '_BigNumber',
  },
  additionalHeader: "import _BigNumber from 'bignumber.js'",
});
`),t()()(),n(294,"blockquote",17)(295,"strong"),e(296,"Hint"),t(),e(297," Alternatively, you can use a type reference instead, for example: "),n(298,"code"),e(299,"DateTime: Date"),t(),e(300,". In this case, "),n(301,"code"),e(302,"GraphQLDefinitionsFactory"),t(),e(303," will extract the name property of the specified type ("),n(304,"code"),e(305,"Date.name"),t(),e(306,`) to generate TS definitions. Note: adding an import statement for non-built-in types (custom types) is required.
`),t(),n(307,"p"),e(308,"Now, given the following GraphQL custom scalar types:"),t(),n(309,"pre")(310,"code",16),e(311,`
scalar DateTime
scalar BigNumber
scalar Payload
`),t()(),n(312,"p"),e(313,"We will now see the following generated TypeScript definitions in "),n(314,"code"),e(315,"src/graphql.ts"),t(),e(316,":"),t(),n(317,"app-copy-button")(318,"pre")(319,"code",8),e(320,`
import _BigNumber from 'bignumber.js';

export type DateTime = Date;
export type BigNumber = _BigNumber;
export type Payload = unknown;
`),t()()(),n(321,"p"),e(322,"Here, we've used the "),n(323,"code"),e(324,"customScalarTypeMapping"),t(),e(325,` property to supply a map of the types we wish to declare for our custom scalars. We've
also provided an `),n(326,"code"),e(327,"additionalHeader"),t(),e(328,` property so that we can add any imports required for these type definitions. Lastly, we've added
a `),n(329,"code"),e(330,"defaultScalarType"),t(),e(331," of "),n(332,"code"),e(333,"'unknown'"),t(),e(334,", so that any custom scalars not specified in "),n(335,"code"),e(336,"customScalarTypeMapping"),t(),e(337,` will be aliased to
`),n(338,"code"),e(339,"unknown"),t(),e(340," instead of "),n(341,"code"),e(342,"any"),t(),e(343," (which "),n(344,"a",18),e(345,"TypeScript recommends"),t(),e(346," using since 3.0 for added type safety)."),t(),n(347,"blockquote",17)(348,"strong"),e(349,"Hint"),t(),e(350," Note that we've imported "),n(351,"code"),e(352,"_BigNumber"),t(),e(353," from "),n(354,"code"),e(355,"bignumber.js"),t(),e(356,"; this is to avoid "),n(357,"a",19),e(358,"circular type references"),t(),e(359,`.
`),t()())},dependencies:[c,h],encapsulation:2,changeDetection:0})}return i})();var J=(()=>{class i extends p{static \u0275fac=(()=>{let r;return function(l){return(r||(r=d(i)))(l||i)}})();static \u0275cmp=s({type:i,selectors:[["app-schema-generator"]],features:[m],decls:74,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/graphql/schema-generator.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","generating-sdl"],[1,"warning"],[1,"language-typescript"],[1,"info"],["appAnchor","","id","usage"]],template:function(o,l){o&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),a(4,"i",4),t()(),n(5,"h3",5),e(6,"Generating SDL"),t(),n(7,"blockquote",6)(8,"strong"),e(9,"Warning"),t(),e(10,` This chapter applies only to the code first approach.
`),t(),n(11,"p"),e(12,"To manually generate a GraphQL SDL schema (i.e., without running an application, connecting to the database, hooking up resolvers, etc.), use the "),n(13,"code"),e(14,"GraphQLSchemaBuilderModule"),t(),e(15,"."),t(),n(16,"app-copy-button")(17,"pre")(18,"code",7),e(19,`
async function generateSchema() {
  const app = await NestFactory.create(GraphQLSchemaBuilderModule);
  await app.init();

  const gqlSchemaFactory = app.get(GraphQLSchemaFactory);
  const schema = await gqlSchemaFactory.create([RecipesResolver]);
  console.log(printSchema(schema));
}
`),t()()(),n(20,"blockquote",8)(21,"strong"),e(22,"Hint"),t(),e(23," The "),n(24,"code"),e(25,"GraphQLSchemaBuilderModule"),t(),e(26," and "),n(27,"code"),e(28,"GraphQLSchemaFactory"),t(),e(29," are imported from the "),n(30,"code"),e(31,"@nestjs/graphql"),t(),e(32," package. The "),n(33,"code"),e(34,"printSchema"),t(),e(35," function is imported from the "),n(36,"code"),e(37,"graphql"),t(),e(38,` package.
`),t(),n(39,"h4",9)(40,"span"),e(41,"Usage"),t()(),n(42,"p"),e(43,"The "),n(44,"code"),e(45,"gqlSchemaFactory.create()"),t(),e(46," method takes an array of resolver class references. For example:"),t(),n(47,"app-copy-button")(48,"pre")(49,"code",7),e(50,`
const schema = await gqlSchemaFactory.create([
  RecipesResolver,
  AuthorsResolver,
  PostsResolver,
]);
`),t()()(),n(51,"p"),e(52,"It also takes a second optional argument with an array of scalar classes:"),t(),n(53,"app-copy-button")(54,"pre")(55,"code",7),e(56,`
const schema = await gqlSchemaFactory.create(
  [RecipesResolver, AuthorsResolver, PostsResolver],
  [DurationScalar, DateScalar],
);
`),t()()(),n(57,"p"),e(58,"Lastly, you can pass an options object:"),t(),n(59,"app-copy-button")(60,"pre")(61,"code",7),e(62,`
const schema = await gqlSchemaFactory.create([RecipesResolver], {
  skipCheck: true,
  orphanedTypes: [],
});
`),t()()(),n(63,"ul")(64,"li")(65,"code"),e(66,"skipCheck"),t(),e(67,": ignore schema validation; boolean, defaults to "),n(68,"code"),e(69,"false"),t()(),n(70,"li")(71,"code"),e(72,"orphanedTypes"),t(),e(73,": list of classes that are not explicitly referenced (not part of the object graph) to be generated. Normally, if a class is declared but isn't otherwise referenced in the graph, it's omitted. The property value is an array of class references."),t()()())},dependencies:[h,c],encapsulation:2,changeDetection:0})}return i})();var z=(()=>{class i extends p{static \u0275fac=(()=>{let r;return function(l){return(r||(r=d(i)))(l||i)}})();static \u0275cmp=s({type:i,selectors:[["app-sharing-models"]],features:[m],decls:42,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/graphql/sharing-models.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","sharing-models"],[1,"warning"],["appAnchor","","id","using-the-model-shim"],[1,"language-typescript"],[1,"info"],["routerLink","/techniques/database"],["rel","nofollow","target","_blank","href","https://github.com/typeorm/typeorm/blob/master/extra/typeorm-model-shim.js"]],template:function(o,l){o&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),a(4,"i",4),t()(),n(5,"h3",5),e(6,"Sharing models"),t(),n(7,"blockquote",6)(8,"strong"),e(9,"Warning"),t(),e(10,` This chapter applies only to the code first approach.
`),t(),n(11,"p"),e(12,"One of the biggest advantages of using Typescript for the backend of your project is the ability to reuse the same models in a Typescript-based frontend application, by using a common Typescript package. "),t(),n(13,"p"),e(14,"But there's a problem: the models created using the code first approach are heavily decorated with GraphQL related decorators. Those decorators are irrelevant in the frontend, negatively impacting performance."),t(),n(15,"h4",7)(16,"span"),e(17,"Using the model shim"),t()(),n(18,"p"),e(19,'To solve this issue, NestJS provides a "shim" which allows you to replace the original decorators with inert code by using a '),n(20,"code"),e(21,"webpack"),t(),e(22,` (or similar) configuration.
To use this shim, configure an alias between the `),n(23,"code"),e(24,"@nestjs/graphql"),t(),e(25," package and the shim."),t(),n(26,"p"),e(27,"For example, for webpack this is resolved this way:"),t(),n(28,"app-copy-button")(29,"pre")(30,"code",8),e(31,`
resolve: { // see: https://webpack.js.org/configuration/resolve/
  alias: {
      "@nestjs/graphql": path.resolve(__dirname, "../node_modules/@nestjs/graphql/dist/extra/graphql-model-shim")
  }
}
`),t()()(),n(32,"blockquote",9)(33,"strong"),e(34,"Hint"),t(),e(35," The "),n(36,"a",10),e(37,"TypeORM"),t(),e(38," package has a similar shim that can be found "),n(39,"a",11),e(40,"here"),t(),e(41,`.
`),t()())},dependencies:[c,h,x],encapsulation:2,changeDetection:0})}return i})();var Y=(()=>{class i extends p{static \u0275fac=(()=>{let r;return function(l){return(r||(r=d(i)))(l||i)}})();static \u0275cmp=s({type:i,selectors:[["app-subscriptions"]],features:[m],decls:713,vars:16,consts:[["contentReference",""],["app2062377a7fb87f0967b818f7ae8e30101068f118",""],["appec29e7e1f44a154b4cde2a20bbe36ba435781e3e",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/graphql/subscriptions.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","subscriptions"],["rel","nofollow","target","_blank","href","https://www.apollographql.com/docs/react/data/subscriptions"],["appAnchor","","id","enable-subscriptions-with-apollo-driver"],[1,"language-typescript"],[1,"warning"],["rel","nofollow","target","_blank","href","https://github.com/apollographql/subscriptions-transport-ws"],["rel","nofollow","target","_blank","href","https://github.com/enisdenjo/graphql-ws"],[1,"info"],["appAnchor","","id","code-first"],["rel","nofollow","target","_blank","href","https://www.apollographql.com/docs/graphql-subscriptions/setup.html"],["rel","nofollow","target","_blank","href","https://github.com/apollographql/graphql-subscriptions#getting-started-with-your-first-subscription"],["rel","nofollow","target","_blank","href","https://github.com/apollographql/graphql-subscriptions#pubsub-implementations"],[1,"language-graphql"],["appAnchor","","id","publishing"],[1,"with-heading"],[1,"filename"],["appAnchor","","id","filtering-subscriptions"],["appAnchor","","id","mutating-subscription-payloads"],["appAnchor","","id","schema-first"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/blob/master/sample/12-graphql-schema-first"],["appAnchor","","id","pubsub"],["routerLink","/fundamentals/custom-providers"],["appAnchor","","id","customize-subscriptions-server"],["appAnchor","","id","authentication-over-websockets"],["rel","nofollow","target","_blank","href","https://www.apollographql.com/docs/react/data/subscriptions/#5-authenticate-over-websocket-optional"],["rel","nofollow","target","_blank","href","https://github.com/apollographql/subscriptions-transport-ws/issues/349"],["appAnchor","","id","enable-subscriptions-with-mercurius-driver"],["rel","nofollow","target","_blank","href","https://github.com/mercurius-js/mercurius/blob/master/docs/api/options.md#plugin-options"],["appAnchor","","id","code-first-1"],["rel","nofollow","target","_blank","href","https://github.com/mercurius-js/mercurius/blob/master/docs/subscriptions.md#subscriptions-with-custom-pubsub"],["appAnchor","","id","publishing-1"],["appAnchor","","id","filtering-subscriptions-1"],["appAnchor","","id","schema-first-1"],["appAnchor","","id","pubsub-1"],["rel","nofollow","target","_blank","href","https://github.com/mcollina/mqemitter"],["rel","nofollow","target","_blank","href","https://github.com/mercurius-js/mercurius/blob/master/docs/subscriptions.md"],["appAnchor","","id","authentication-over-websockets-1"]],template:function(o,l){if(o&1&&(n(0,"div",3,0)(2,"div",4)(3,"a",5),a(4,"i",6),t()(),n(5,"h3",7),e(6,"Subscriptions"),t(),n(7,"p"),e(8,"In addition to fetching data using queries and modifying data using mutations, the GraphQL spec supports a third operation type, called "),n(9,"code"),e(10,"subscription"),t(),e(11,". GraphQL subscriptions are a way to push data from the server to the clients that choose to listen to real time messages from the server. Subscriptions are similar to queries in that they specify a set of fields to be delivered to the client, but instead of immediately returning a single answer, a channel is opened and a result is sent to the client every time a particular event happens on the server."),t(),n(12,"p"),e(13,"A common use case for subscriptions is notifying the client side about particular events, for example the creation of a new object, updated fields and so on (read more "),n(14,"a",8),e(15,"here"),t(),e(16,")."),t(),n(17,"h4",9)(18,"span"),e(19,"Enable subscriptions with Apollo driver"),t()(),n(20,"p"),e(21,"To enable subscriptions, set the "),n(22,"code"),e(23,"installSubscriptionHandlers"),t(),e(24," property to "),n(25,"code"),e(26,"true"),t(),e(27,"."),t(),n(28,"app-copy-button")(29,"pre")(30,"code",10),e(31,`
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  installSubscriptionHandlers: true,
}),
`),t()()(),n(32,"blockquote",11)(33,"strong"),e(34,"Warning"),t(),e(35," The "),n(36,"code"),e(37,"installSubscriptionHandlers"),t(),e(38," configuration option has been removed from the latest version of Apollo server and will be soon deprecated in this package as well. By default, "),n(39,"code"),e(40,"installSubscriptionHandlers"),t(),e(41," will fallback to use the "),n(42,"code"),e(43,"subscriptions-transport-ws"),t(),e(44," ("),n(45,"a",12),e(46,"read more"),t(),e(47,") but we strongly recommend using the "),n(48,"code"),e(49,"graphql-ws"),t(),e(50,"("),n(51,"a",13),e(52,"read more"),t(),e(53,`) library instead.
`),t(),n(54,"p"),e(55,"To switch to use the "),n(56,"code"),e(57,"graphql-ws"),t(),e(58," package instead, use the following configuration:"),t(),n(59,"app-copy-button")(60,"pre")(61,"code",10),e(62,`
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  subscriptions: {
    'graphql-ws': true
  },
}),
`),t()()(),n(63,"blockquote",14)(64,"strong"),e(65,"Hint"),t(),e(66," You can also use both packages ("),n(67,"code"),e(68,"subscriptions-transport-ws"),t(),e(69," and "),n(70,"code"),e(71,"graphql-ws"),t(),e(72,`) at the same time, for example, for backward compatibility.
`),t(),n(73,"h4",15)(74,"span"),e(75,"Code first"),t()(),n(76,"p"),e(77,"To create a subscription using the code first approach, we use the "),n(78,"code"),e(79,"@Subscription()"),t(),e(80," decorator (exported from the "),n(81,"code"),e(82,"@nestjs/graphql"),t(),e(83," package) and the "),n(84,"code"),e(85,"PubSub"),t(),e(86," class from the "),n(87,"code"),e(88,"graphql-subscriptions"),t(),e(89," package, which provides a simple "),n(90,"strong"),e(91,"publish/subscribe API"),t(),e(92,"."),t(),n(93,"p"),e(94,"The following subscription handler takes care of "),n(95,"strong"),e(96,"subscribing"),t(),e(97," to an event by calling "),n(98,"code"),e(99,"PubSub#asyncIterableIterator"),t(),e(100,". This method takes a single argument, the "),n(101,"code"),e(102,"triggerName"),t(),e(103,", which corresponds to an event topic name."),t(),n(104,"app-copy-button")(105,"pre")(106,"code",10),e(107,`
const pubSub = new PubSub();

@Resolver(() => Author)
export class AuthorResolver {
  // ...
  @Subscription(() => Comment)
  commentAdded() {
    return pubSub.asyncIterableIterator('commentAdded');
  }
}
`),t()()(),n(108,"blockquote",14)(109,"strong"),e(110,"Hint"),t(),e(111," All decorators are exported from the "),n(112,"code"),e(113,"@nestjs/graphql"),t(),e(114," package, while the "),n(115,"code"),e(116,"PubSub"),t(),e(117," class is exported from the "),n(118,"code"),e(119,"graphql-subscriptions"),t(),e(120,` package.
`),t(),n(121,"blockquote",11)(122,"strong"),e(123,"Note"),t(),n(124,"code"),e(125,"PubSub"),t(),e(126," is a class that exposes a simple "),n(127,"code"),e(128,"publish"),t(),e(129," and "),n(130,"code"),e(131,"subscribe API"),t(),e(132,". Read more about it "),n(133,"a",16),e(134,"here"),t(),e(135,". Note that the Apollo docs warn that the default implementation is not suitable for production (read more "),n(136,"a",17),e(137,"here"),t(),e(138,"). Production apps should use a "),n(139,"code"),e(140,"PubSub"),t(),e(141," implementation backed by an external store (read more "),n(142,"a",18),e(143,"here"),t(),e(144,`).
`),t(),n(145,"p"),e(146,"This will result in generating the following part of the GraphQL schema in SDL:"),t(),n(147,"pre")(148,"code",19),e(149,`
type Subscription {
  commentAdded(): Comment!
}
`),t()(),n(150,"p"),e(151,"Note that subscriptions, by definition, return an object with a single top level property whose key is the name of the subscription. This name is either inherited from the name of the subscription handler method (i.e., "),n(152,"code"),e(153,"commentAdded"),t(),e(154," above), or is provided explicitly by passing an option with the key "),n(155,"code"),e(156,"name"),t(),e(157," as the second argument to the "),n(158,"code"),e(159,"@Subscription()"),t(),e(160," decorator, as shown below."),t(),n(161,"app-copy-button")(162,"pre")(163,"code",10),e(164,`
@Subscription(() => Comment, {
  name: 'commentAdded',
})
subscribeToCommentAdded() {
  return pubSub.asyncIterableIterator('commentAdded');
}
`),t()()(),n(165,"p"),e(166,"This construct produces the same SDL as the previous code sample, but allows us to decouple the method name from the subscription."),t(),n(167,"h4",20)(168,"span"),e(169,"Publishing"),t()(),n(170,"p"),e(171,"Now, to publish the event, we use the "),n(172,"code"),e(173,"PubSub#publish"),t(),e(174," method. This is often used within a mutation to trigger a client-side update when a part of the object graph has changed. For example:"),t(),n(175,"app-copy-button",21)(176,"span",22),e(177),E(178,"extension"),a(179,"app-tabs",null,1),t(),n(181,"pre")(182,"code",10),e(183,`
@Mutation(() => Comment)
async addComment(
  @Args('postId', { type: () => Int }) postId: number,
  @Args('comment', { type: () => Comment }) comment: CommentInput,
) {
  const newComment = this.commentsService.addComment({ id: postId, comment });
  pubSub.publish('commentAdded', { commentAdded: newComment });
  return newComment;
}
`),t()()(),n(184,"p"),e(185,"The "),n(186,"code"),e(187,"PubSub#publish"),t(),e(188," method takes a "),n(189,"code"),e(190,"triggerName"),t(),e(191," (again, think of this as an event topic name) as the first parameter, and an event payload as the second parameter. As mentioned, the subscription, by definition, returns a value and that value has a shape. Look again at the generated SDL for our "),n(192,"code"),e(193,"commentAdded"),t(),e(194," subscription:"),t(),n(195,"pre")(196,"code",19),e(197,`
type Subscription {
  commentAdded(): Comment!
}
`),t()(),n(198,"p"),e(199,"This tells us that the subscription must return an object with a top-level property name of "),n(200,"code"),e(201,"commentAdded"),t(),e(202," that has a value which is a "),n(203,"code"),e(204,"Comment"),t(),e(205," object. The important point to note is that the shape of the event payload emitted by the "),n(206,"code"),e(207,"PubSub#publish"),t(),e(208," method must correspond to the shape of the value expected to return from the subscription. So, in our example above, the "),n(209,"code"),e(210),t(),e(211," statement publishes a "),n(212,"code"),e(213,"commentAdded"),t(),e(214," event with the appropriately shaped payload. If these shapes don't match, your subscription will fail during the GraphQL validation phase."),t(),n(215,"h4",23)(216,"span"),e(217,"Filtering subscriptions"),t()(),n(218,"p"),e(219,"To filter out specific events, set the "),n(220,"code"),e(221,"filter"),t(),e(222," property to a filter function. This function acts similar to the function passed to an array "),n(223,"code"),e(224,"filter"),t(),e(225,". It takes two arguments: "),n(226,"code"),e(227,"payload"),t(),e(228," containing the event payload (as sent by the event publisher), and "),n(229,"code"),e(230,"variables"),t(),e(231," taking any arguments passed in during the subscription request. It returns a boolean determining whether this event should be published to client listeners."),t(),n(232,"app-copy-button")(233,"pre")(234,"code",10),e(235,`
@Subscription(() => Comment, {
  filter: (payload, variables) =>
    payload.commentAdded.title === variables.title,
})
commentAdded(@Args('title') title: string) {
  return pubSub.asyncIterableIterator('commentAdded');
}
`),t()()(),n(236,"h4",24)(237,"span"),e(238,"Mutating subscription payloads"),t()(),n(239,"p"),e(240,"To mutate the published event payload, set the "),n(241,"code"),e(242,"resolve"),t(),e(243," property to a function. The function receives the event payload (as sent by the event publisher) and returns the appropriate value."),t(),n(244,"app-copy-button")(245,"pre")(246,"code",10),e(247,`
@Subscription(() => Comment, {
  resolve: value => value,
})
commentAdded() {
  return pubSub.asyncIterableIterator('commentAdded');
}
`),t()()(),n(248,"blockquote",11)(249,"strong"),e(250,"Note"),t(),e(251," If you use the "),n(252,"code"),e(253,"resolve"),t(),e(254," option, you should return the unwrapped payload (e.g., with our example, return a "),n(255,"code"),e(256,"newComment"),t(),e(257," object directly, not a "),n(258,"code"),e(259),t(),e(260,` object).
`),t(),n(261,"p"),e(262,"If you need to access injected providers (e.g., use an external service to validate the data), use the following construction."),t(),n(263,"app-copy-button")(264,"pre")(265,"code",10),e(266,`
@Subscription(() => Comment, {
  resolve(this: AuthorResolver, value) {
    // "this" refers to an instance of "AuthorResolver"
    return value;
  }
})
commentAdded() {
  return pubSub.asyncIterableIterator('commentAdded');
}
`),t()()(),n(267,"p"),e(268,"The same construction works with filters:"),t(),n(269,"app-copy-button")(270,"pre")(271,"code",10),e(272,`
@Subscription(() => Comment, {
  filter(this: AuthorResolver, payload, variables) {
    // "this" refers to an instance of "AuthorResolver"
    return payload.commentAdded.title === variables.title;
  }
})
commentAdded() {
  return pubSub.asyncIterableIterator('commentAdded');
}
`),t()()(),n(273,"h4",25)(274,"span"),e(275,"Schema first"),t()(),n(276,"p"),e(277,"To create an equivalent subscription in Nest, we'll make use of the "),n(278,"code"),e(279,"@Subscription()"),t(),e(280," decorator."),t(),n(281,"app-copy-button")(282,"pre")(283,"code",10),e(284,`
const pubSub = new PubSub();

@Resolver('Author')
export class AuthorResolver {
  // ...
  @Subscription()
  commentAdded() {
    return pubSub.asyncIterableIterator('commentAdded');
  }
}
`),t()()(),n(285,"p"),e(286,"To filter out specific events based on context and arguments, set the "),n(287,"code"),e(288,"filter"),t(),e(289," property."),t(),n(290,"app-copy-button")(291,"pre")(292,"code",10),e(293,`
@Subscription('commentAdded', {
  filter: (payload, variables) =>
    payload.commentAdded.title === variables.title,
})
commentAdded() {
  return pubSub.asyncIterableIterator('commentAdded');
}
`),t()()(),n(294,"p"),e(295,"To mutate the published payload, we can use a "),n(296,"code"),e(297,"resolve"),t(),e(298," function."),t(),n(299,"app-copy-button")(300,"pre")(301,"code",10),e(302,`
@Subscription('commentAdded', {
  resolve: value => value,
})
commentAdded() {
  return pubSub.asyncIterableIterator('commentAdded');
}
`),t()()(),n(303,"p"),e(304,"If you need to access injected providers (e.g., use an external service to validate the data), use the following construction:"),t(),n(305,"app-copy-button")(306,"pre")(307,"code",10),e(308,`
@Subscription('commentAdded', {
  resolve(this: AuthorResolver, value) {
    // "this" refers to an instance of "AuthorResolver"
    return value;
  }
})
commentAdded() {
  return pubSub.asyncIterableIterator('commentAdded');
}
`),t()()(),n(309,"p"),e(310,"The same construction works with filters:"),t(),n(311,"app-copy-button")(312,"pre")(313,"code",10),e(314,`
@Subscription('commentAdded', {
  filter(this: AuthorResolver, payload, variables) {
    // "this" refers to an instance of "AuthorResolver"
    return payload.commentAdded.title === variables.title;
  }
})
commentAdded() {
  return pubSub.asyncIterableIterator('commentAdded');
}
`),t()()(),n(315,"p"),e(316,"The last step is to update the type definitions file."),t(),n(317,"pre")(318,"code",19),e(319,`
type Author {
  id: Int!
  firstName: String
  lastName: String
  posts: [Post]
}

type Post {
  id: Int!
  title: String
  votes: Int
}

type Query {
  author(id: Int!): Author
}

type Comment {
  id: String
  content: String
}

type Subscription {
  commentAdded(title: String!): Comment
}
`),t()(),n(320,"p"),e(321,"With this, we've created a single "),n(322,"code"),e(323,"commentAdded(title: String!): Comment"),t(),e(324," subscription. You can find a full sample implementation "),n(325,"a",26),e(326,"here"),t(),e(327,"."),t(),n(328,"h4",27)(329,"span"),e(330,"PubSub"),t()(),n(331,"p"),e(332,"We instantiated a local "),n(333,"code"),e(334,"PubSub"),t(),e(335," instance above. The preferred approach is to define "),n(336,"code"),e(337,"PubSub"),t(),e(338," as a "),n(339,"a",28),e(340,"provider"),t(),e(341," and inject it through the constructor (using the "),n(342,"code"),e(343,"@Inject()"),t(),e(344," decorator). This allows us to re-use the instance across the whole application. For example, define a provider as follows, then inject "),n(345,"code"),e(346,"'PUB_SUB'"),t(),e(347," where needed."),t(),n(348,"app-copy-button")(349,"pre")(350,"code",10),e(351,`
{
  provide: 'PUB_SUB',
  useValue: new PubSub(),
}
`),t()()(),n(352,"h4",29)(353,"span"),e(354,"Customize subscriptions server"),t()(),n(355,"p"),e(356,"To customize the subscriptions server (e.g., change the path), use the "),n(357,"code"),e(358,"subscriptions"),t(),e(359," options property."),t(),n(360,"app-copy-button")(361,"pre")(362,"code",10),e(363,`
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  subscriptions: {
    'subscriptions-transport-ws': {
      path: '/graphql'
    },
  }
}),
`),t()()(),n(364,"p"),e(365,"If you're using the "),n(366,"code"),e(367,"graphql-ws"),t(),e(368," package for subscriptions, replace the "),n(369,"code"),e(370,"subscriptions-transport-ws"),t(),e(371," key with "),n(372,"code"),e(373,"graphql-ws"),t(),e(374,", as follows:"),t(),n(375,"app-copy-button")(376,"pre")(377,"code",10),e(378,`
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  subscriptions: {
    'graphql-ws': {
      path: '/graphql'
    },
  }
}),
`),t()()(),n(379,"h4",30)(380,"span"),e(381,"Authentication over WebSockets"),t()(),n(382,"p"),e(383,"Checking whether the user is authenticated can be done inside the "),n(384,"code"),e(385,"onConnect"),t(),e(386," callback function that you can specify in the "),n(387,"code"),e(388,"subscriptions"),t(),e(389," options."),t(),n(390,"p"),e(391,"The "),n(392,"code"),e(393,"onConnect"),t(),e(394," will receive as a first argument the "),n(395,"code"),e(396,"connectionParams"),t(),e(397," passed to the "),n(398,"code"),e(399,"SubscriptionClient"),t(),e(400," (read "),n(401,"a",31),e(402,"more"),t(),e(403,")."),t(),n(404,"app-copy-button")(405,"pre")(406,"code",10),e(407,`
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  subscriptions: {
    'subscriptions-transport-ws': {
      onConnect: (connectionParams) => {
        const authToken = connectionParams.authToken;
        if (!isValid(authToken)) {
          throw new Error('Token is not valid');
        }
        // extract user information from token
        const user = parseToken(authToken);
        // return user info to add them to the context later
        return { user };
      },
    }
  },
  context: ({ connection }) => {
    // connection.context will be equal to what was returned by the "onConnect" callback
  },
}),
`),t()()(),n(408,"p"),e(409,"The "),n(410,"code"),e(411,"authToken"),t(),e(412,` in this example is only sent once by the client, when the connection is first established.
All subscriptions made with this connection will have the same `),n(413,"code"),e(414,"authToken"),t(),e(415,", and thus the same user info."),t(),n(416,"blockquote",11)(417,"strong"),e(418,"Note"),t(),e(419," There is a bug in "),n(420,"code"),e(421,"subscriptions-transport-ws"),t(),e(422," that allows connections to skip the "),n(423,"code"),e(424,"onConnect"),t(),e(425," phase (read "),n(426,"a",32),e(427,"more"),t(),e(428,"). You should not assume that "),n(429,"code"),e(430,"onConnect"),t(),e(431," was called when the user starts a subscription, and always check that the "),n(432,"code"),e(433,"context"),t(),e(434,` is populated.
`),t(),n(435,"p"),e(436,"If you're using the "),n(437,"code"),e(438,"graphql-ws"),t(),e(439," package, the signature of the "),n(440,"code"),e(441,"onConnect"),t(),e(442," callback will be slightly different:"),t(),n(443,"app-copy-button")(444,"pre")(445,"code",10),e(446,`
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  subscriptions: {
    'graphql-ws': {
      onConnect: (context: Context<any>) => {
        const { connectionParams, extra } = context;
        // user validation will remain the same as in the example above
        // when using with graphql-ws, additional context value should be stored in the extra field
        extra.user = { user: {} };
      },
    },
  },
  context: ({ extra }) => {
    // you can now access your additional context value through the extra field
  },
});
`),t()()(),n(447,"h4",33)(448,"span"),e(449,"Enable subscriptions with Mercurius driver"),t()(),n(450,"p"),e(451,"To enable subscriptions, set the "),n(452,"code"),e(453,"subscription"),t(),e(454," property to "),n(455,"code"),e(456,"true"),t(),e(457,"."),t(),n(458,"app-copy-button")(459,"pre")(460,"code",10),e(461,`
GraphQLModule.forRoot<MercuriusDriverConfig>({
  driver: MercuriusDriver,
  subscription: true,
}),
`),t()()(),n(462,"blockquote",14)(463,"strong"),e(464,"Hint"),t(),e(465," You can also pass the options object to set up a custom emitter, validate incoming connections, etc. Read more "),n(466,"a",34),e(467,"here"),t(),e(468," (see "),n(469,"code"),e(470,"subscription"),t(),e(471,`).
`),t(),n(472,"h4",35)(473,"span"),e(474,"Code first"),t()(),n(475,"p"),e(476,"To create a subscription using the code first approach, we use the "),n(477,"code"),e(478,"@Subscription()"),t(),e(479," decorator (exported from the "),n(480,"code"),e(481,"@nestjs/graphql"),t(),e(482," package) and the "),n(483,"code"),e(484,"PubSub"),t(),e(485," class from the "),n(486,"code"),e(487,"mercurius"),t(),e(488," package, which provides a simple "),n(489,"strong"),e(490,"publish/subscribe API"),t(),e(491,"."),t(),n(492,"p"),e(493,"The following subscription handler takes care of "),n(494,"strong"),e(495,"subscribing"),t(),e(496," to an event by calling "),n(497,"code"),e(498,"PubSub#asyncIterableIterator"),t(),e(499,". This method takes a single argument, the "),n(500,"code"),e(501,"triggerName"),t(),e(502,", which corresponds to an event topic name."),t(),n(503,"app-copy-button")(504,"pre")(505,"code",10),e(506,`
@Resolver(() => Author)
export class AuthorResolver {
  // ...
  @Subscription(() => Comment)
  commentAdded(@Context('pubsub') pubSub: PubSub) {
    return pubSub.subscribe('commentAdded');
  }
}
`),t()()(),n(507,"blockquote",14)(508,"strong"),e(509,"Hint"),t(),e(510," All decorators used in the example above are exported from the "),n(511,"code"),e(512,"@nestjs/graphql"),t(),e(513," package, while the "),n(514,"code"),e(515,"PubSub"),t(),e(516," class is exported from the "),n(517,"code"),e(518,"mercurius"),t(),e(519,` package.
`),t(),n(520,"blockquote",11)(521,"strong"),e(522,"Note"),t(),n(523,"code"),e(524,"PubSub"),t(),e(525," is a class that exposes a simple "),n(526,"code"),e(527,"publish"),t(),e(528," and "),n(529,"code"),e(530,"subscribe"),t(),e(531," API. Check out "),n(532,"a",36),e(533,"this section"),t(),e(534," on how to register a custom "),n(535,"code"),e(536,"PubSub"),t(),e(537,` class.
`),t(),n(538,"p"),e(539,"This will result in generating the following part of the GraphQL schema in SDL:"),t(),n(540,"pre")(541,"code",19),e(542,`
type Subscription {
  commentAdded(): Comment!
}
`),t()(),n(543,"p"),e(544,"Note that subscriptions, by definition, return an object with a single top level property whose key is the name of the subscription. This name is either inherited from the name of the subscription handler method (i.e., "),n(545,"code"),e(546,"commentAdded"),t(),e(547," above), or is provided explicitly by passing an option with the key "),n(548,"code"),e(549,"name"),t(),e(550," as the second argument to the "),n(551,"code"),e(552,"@Subscription()"),t(),e(553," decorator, as shown below."),t(),n(554,"app-copy-button")(555,"pre")(556,"code",10),e(557,`
@Subscription(() => Comment, {
  name: 'commentAdded',
})
subscribeToCommentAdded(@Context('pubsub') pubSub: PubSub) {
  return pubSub.subscribe('commentAdded');
}
`),t()()(),n(558,"p"),e(559,"This construct produces the same SDL as the previous code sample, but allows us to decouple the method name from the subscription."),t(),n(560,"h4",37)(561,"span"),e(562,"Publishing"),t()(),n(563,"p"),e(564,"Now, to publish the event, we use the "),n(565,"code"),e(566,"PubSub#publish"),t(),e(567," method. This is often used within a mutation to trigger a client-side update when a part of the object graph has changed. For example:"),t(),n(568,"app-copy-button",21)(569,"span",22),e(570),E(571,"extension"),a(572,"app-tabs",null,2),t(),n(574,"pre")(575,"code",10),e(576,`
@Mutation(() => Comment)
async addComment(
  @Args('postId', { type: () => Int }) postId: number,
  @Args('comment', { type: () => Comment }) comment: CommentInput,
  @Context('pubsub') pubSub: PubSub,
) {
  const newComment = this.commentsService.addComment({ id: postId, comment });
  await pubSub.publish({
    topic: 'commentAdded',
    payload: {
      commentAdded: newComment
    }
  });
  return newComment;
}
`),t()()(),n(577,"p"),e(578,"As mentioned, the subscription, by definition, returns a value and that value has a shape. Look again at the generated SDL for our "),n(579,"code"),e(580,"commentAdded"),t(),e(581," subscription:"),t(),n(582,"pre")(583,"code",19),e(584,`
type Subscription {
  commentAdded(): Comment!
}
`),t()(),n(585,"p"),e(586,"This tells us that the subscription must return an object with a top-level property name of "),n(587,"code"),e(588,"commentAdded"),t(),e(589," that has a value which is a "),n(590,"code"),e(591,"Comment"),t(),e(592," object. The important point to note is that the shape of the event payload emitted by the "),n(593,"code"),e(594,"PubSub#publish"),t(),e(595," method must correspond to the shape of the value expected to return from the subscription. So, in our example above, the "),n(596,"code"),e(597),t(),e(598," statement publishes a "),n(599,"code"),e(600,"commentAdded"),t(),e(601," event with the appropriately shaped payload. If these shapes don't match, your subscription will fail during the GraphQL validation phase."),t(),n(602,"h4",38)(603,"span"),e(604,"Filtering subscriptions"),t()(),n(605,"p"),e(606,"To filter out specific events, set the "),n(607,"code"),e(608,"filter"),t(),e(609," property to a filter function. This function acts similar to the function passed to an array "),n(610,"code"),e(611,"filter"),t(),e(612,". It takes two arguments: "),n(613,"code"),e(614,"payload"),t(),e(615," containing the event payload (as sent by the event publisher), and "),n(616,"code"),e(617,"variables"),t(),e(618," taking any arguments passed in during the subscription request. It returns a boolean determining whether this event should be published to client listeners."),t(),n(619,"app-copy-button")(620,"pre")(621,"code",10),e(622,`
@Subscription(() => Comment, {
  filter: (payload, variables) =>
    payload.commentAdded.title === variables.title,
})
commentAdded(@Args('title') title: string, @Context('pubsub') pubSub: PubSub) {
  return pubSub.subscribe('commentAdded');
}
`),t()()(),n(623,"p"),e(624,"If you need to access injected providers (e.g., use an external service to validate the data), use the following construction."),t(),n(625,"app-copy-button")(626,"pre")(627,"code",10),e(628,`
@Subscription(() => Comment, {
  filter(this: AuthorResolver, payload, variables) {
    // "this" refers to an instance of "AuthorResolver"
    return payload.commentAdded.title === variables.title;
  }
})
commentAdded(@Args('title') title: string, @Context('pubsub') pubSub: PubSub) {
  return pubSub.subscribe('commentAdded');
}
`),t()()(),n(629,"h4",39)(630,"span"),e(631,"Schema first"),t()(),n(632,"p"),e(633,"To create an equivalent subscription in Nest, we'll make use of the "),n(634,"code"),e(635,"@Subscription()"),t(),e(636," decorator."),t(),n(637,"app-copy-button")(638,"pre")(639,"code",10),e(640,`
const pubSub = new PubSub();

@Resolver('Author')
export class AuthorResolver {
  // ...
  @Subscription()
  commentAdded(@Context('pubsub') pubSub: PubSub) {
    return pubSub.subscribe('commentAdded');
  }
}
`),t()()(),n(641,"p"),e(642,"To filter out specific events based on context and arguments, set the "),n(643,"code"),e(644,"filter"),t(),e(645," property."),t(),n(646,"app-copy-button")(647,"pre")(648,"code",10),e(649,`
@Subscription('commentAdded', {
  filter: (payload, variables) =>
    payload.commentAdded.title === variables.title,
})
commentAdded(@Context('pubsub') pubSub: PubSub) {
  return pubSub.subscribe('commentAdded');
}
`),t()()(),n(650,"p"),e(651,"If you need to access injected providers (e.g., use an external service to validate the data), use the following construction:"),t(),n(652,"app-copy-button")(653,"pre")(654,"code",10),e(655,`
@Subscription('commentAdded', {
  filter(this: AuthorResolver, payload, variables) {
    // "this" refers to an instance of "AuthorResolver"
    return payload.commentAdded.title === variables.title;
  }
})
commentAdded(@Context('pubsub') pubSub: PubSub) {
  return pubSub.subscribe('commentAdded');
}
`),t()()(),n(656,"p"),e(657,"The last step is to update the type definitions file."),t(),n(658,"pre")(659,"code",19),e(660,`
type Author {
  id: Int!
  firstName: String
  lastName: String
  posts: [Post]
}

type Post {
  id: Int!
  title: String
  votes: Int
}

type Query {
  author(id: Int!): Author
}

type Comment {
  id: String
  content: String
}

type Subscription {
  commentAdded(title: String!): Comment
}
`),t()(),n(661,"p"),e(662,"With this, we've created a single "),n(663,"code"),e(664,"commentAdded(title: String!): Comment"),t(),e(665," subscription."),t(),n(666,"h4",40)(667,"span"),e(668,"PubSub"),t()(),n(669,"p"),e(670,"In the examples above, we used the default "),n(671,"code"),e(672,"PubSub"),t(),e(673," emitter ("),n(674,"a",41),e(675,"mqemitter"),t(),e(676,`)
The preferred approach (for production) is to use `),n(677,"code"),e(678,"mqemitter-redis"),t(),e(679,". Alternatively, a custom "),n(680,"code"),e(681,"PubSub"),t(),e(682," implementation can be provided (read more "),n(683,"a",42),e(684,"here"),t(),e(685,")"),t(),n(686,"app-copy-button")(687,"pre")(688,"code",10),e(689,`
GraphQLModule.forRoot<MercuriusDriverConfig>({
  driver: MercuriusDriver,
  subscription: {
    emitter: require('mqemitter-redis')({
      port: 6579,
      host: '127.0.0.1',
    }),
  },
});
`),t()()(),n(690,"h4",43)(691,"span"),e(692,"Authentication over WebSockets"),t()(),n(693,"p"),e(694,"Checking whether the user is authenticated can be done inside the "),n(695,"code"),e(696,"verifyClient"),t(),e(697," callback function that you can specify in the "),n(698,"code"),e(699,"subscription"),t(),e(700," options."),t(),n(701,"p"),e(702,"The "),n(703,"code"),e(704,"verifyClient"),t(),e(705," will receive the "),n(706,"code"),e(707,"info"),t(),e(708," object as a first argument which you can use to retrieve the request's headers."),t(),n(709,"app-copy-button")(710,"pre")(711,"code",10),e(712,`
GraphQLModule.forRoot<MercuriusDriverConfig>({
  driver: MercuriusDriver,
  subscription: {
    verifyClient: (info, next) => {
      const authorization = info.req.headers?.authorization as string;
      if (!authorization?.startsWith('Bearer ')) {
        return next(false);
      }
      next(true);
    },
  }
}),
`),t()()()()),o&2){let q=g(180),k=g(573);u(177),S(" ",y(178,10,"posts/posts.resolver",q.isJsActive),`
`),u(33),w("pubSub.publish('commentAdded', ","{"," commentAdded: newComment ","}",")"),u(49),w("","{"," commentAdded: newComment ","}"),u(311),S(" ",y(571,13,"posts/posts.resolver",k.isJsActive),`
`),u(27),I("pubSub.publish(","{"," topic: 'commentAdded', payload: ","{"," commentAdded: newComment ","}"," ","}",")")}},dependencies:[c,h,A,x,T],encapsulation:2,changeDetection:0})}return i})();var $=(()=>{class i extends p{static \u0275fac=(()=>{let r;return function(l){return(r||(r=d(i)))(l||i)}})();static \u0275cmp=s({type:i,selectors:[["app-unions-enums"]],features:[m],decls:267,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/graphql/unions-and-enums.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","unions"],["rel","nofollow","target","_blank","href","https://graphql.org/learn/schema/#union-types"],["appAnchor","","id","code-first"],["rel","nofollow","target","_blank","href","https://www.apollographql.com/docs/apollo-server/schema/unions-interfaces/#union-type"],[1,"language-typescript"],[1,"warning"],[1,"language-graphql"],["appAnchor","","id","schema-first"],["routerLink","/graphql/quick-start"],[1,"info"],["id","enums"],["rel","nofollow","target","_blank","href","https://graphql.org/learn/schema/#enumeration-types"],["appAnchor","","id","code-first-1"],["appAnchor","","id","schema-first-1"],["rel","nofollow","target","_blank","href","https://www.apollographql.com/docs/apollo-server/schema/scalars-enums/#internal-values"]],template:function(o,l){o&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),a(4,"i",4),t()(),n(5,"h3",5),e(6,"Unions"),t(),n(7,"p"),e(8,"Union types are very similar to interfaces, but they don't get to specify any common fields between the types (read more "),n(9,"a",6),e(10,"here"),t(),e(11,"). Unions are useful for returning disjoint data types from a single field."),t(),n(12,"h4",7)(13,"span"),e(14,"Code first"),t()(),n(15,"p"),e(16,"To define a GraphQL union type, we must define classes that this union will be composed of. Following the "),n(17,"a",8),e(18,"example"),t(),e(19," from the Apollo documentation, we'll create two classes. First, "),n(20,"code"),e(21,"Book"),t(),e(22,":"),t(),n(23,"app-copy-button")(24,"pre")(25,"code",9),e(26,`
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Book {
  @Field()
  title: string;
}
`),t()()(),n(27,"p"),e(28,"And then "),n(29,"code"),e(30,"Author"),t(),e(31,":"),t(),n(32,"app-copy-button")(33,"pre")(34,"code",9),e(35,`
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Author {
  @Field()
  name: string;
}
`),t()()(),n(36,"p"),e(37,"With this in place, register the "),n(38,"code"),e(39,"ResultUnion"),t(),e(40," union using the "),n(41,"code"),e(42,"createUnionType"),t(),e(43," function exported from the "),n(44,"code"),e(45,"@nestjs/graphql"),t(),e(46," package:"),t(),n(47,"app-copy-button")(48,"pre")(49,"code",9),e(50,`
export const ResultUnion = createUnionType({
  name: 'ResultUnion',
  types: () => [Author, Book] as const,
});
`),t()()(),n(51,"blockquote",10)(52,"strong"),e(53,"Warning"),t(),e(54," The array returned by the "),n(55,"code"),e(56,"types"),t(),e(57," property of the "),n(58,"code"),e(59,"createUnionType"),t(),e(60,` function should be given a const assertion. If the const assertion is not given, a wrong declaration file will be generated at compile time, and an error will occur when using it from another project.
`),t(),n(61,"p"),e(62,"Now, we can reference the "),n(63,"code"),e(64,"ResultUnion"),t(),e(65," in our query:"),t(),n(66,"app-copy-button")(67,"pre")(68,"code",9),e(69,`
@Query(() => [ResultUnion])
search(): Array<typeof ResultUnion> {
  return [new Author(), new Book()];
}
`),t()()(),n(70,"p"),e(71,"This will result in generating the following part of the GraphQL schema in SDL:"),t(),n(72,"pre")(73,"code",11),e(74,`
type Author {
  name: String!
}

type Book {
  title: String!
}

union ResultUnion = Author | Book

type Query {
  search: [ResultUnion!]!
}
`),t()(),n(75,"p"),e(76,"The default "),n(77,"code"),e(78,"resolveType()"),t(),e(79," function generated by the library will extract the type based on the value returned from the resolver method. That means returning class instances instead of literal JavaScript object is obligatory."),t(),n(80,"p"),e(81,"To provide a customized "),n(82,"code"),e(83,"resolveType()"),t(),e(84," function, pass the "),n(85,"code"),e(86,"resolveType"),t(),e(87," property to the options object passed into the "),n(88,"code"),e(89,"createUnionType()"),t(),e(90," function, as follows:"),t(),n(91,"app-copy-button")(92,"pre")(93,"code",9),e(94,`
export const ResultUnion = createUnionType({
  name: 'ResultUnion',
  types: () => [Author, Book] as const,
  resolveType(value) {
    if (value.name) {
      return Author;
    }
    if (value.title) {
      return Book;
    }
    return null;
  },
});
`),t()()(),n(95,"h4",12)(96,"span"),e(97,"Schema first"),t()(),n(98,"p"),e(99,"To define a union in the schema first approach, simply create a GraphQL union with SDL."),t(),n(100,"pre")(101,"code",11),e(102,`
type Author {
  name: String!
}

type Book {
  title: String!
}

union ResultUnion = Author | Book
`),t()(),n(103,"p"),e(104,"Then, you can use the typings generation feature (as shown in the "),n(105,"a",13),e(106,"quick start"),t(),e(107," chapter) to generate corresponding TypeScript definitions:"),t(),n(108,"app-copy-button")(109,"pre")(110,"code",9),e(111,`
export class Author {
  name: string;
}

export class Book {
  title: string;
}

export type ResultUnion = Author | Book;
`),t()()(),n(112,"p"),e(113,"Unions require an extra "),n(114,"code"),e(115,"__resolveType"),t(),e(116," field in the resolver map to determine which type the union should resolve to. Also, note that the "),n(117,"code"),e(118,"ResultUnionResolver"),t(),e(119," class has to be registered as a provider in any module. Let's create a "),n(120,"code"),e(121,"ResultUnionResolver"),t(),e(122," class and define the "),n(123,"code"),e(124,"__resolveType"),t(),e(125," method."),t(),n(126,"app-copy-button")(127,"pre")(128,"code",9),e(129,`
@Resolver('ResultUnion')
export class ResultUnionResolver {
  @ResolveField()
  __resolveType(value) {
    if (value.name) {
      return 'Author';
    }
    if (value.title) {
      return 'Book';
    }
    return null;
  }
}
`),t()()(),n(130,"blockquote",14)(131,"strong"),e(132,"Hint"),t(),e(133," All decorators are exported from the "),n(134,"code"),e(135,"@nestjs/graphql"),t(),e(136,` package.
`),t(),n(137,"h3",15),e(138,"Enums"),t(),n(139,"p"),e(140,"Enumeration types are a special kind of scalar that is restricted to a particular set of allowed values (read more "),n(141,"a",16),e(142,"here"),t(),e(143,"). This allows you to:"),t(),n(144,"ul")(145,"li"),e(146,"validate that any arguments of this type are one of the allowed values"),t(),n(147,"li"),e(148,"communicate through the type system that a field will always be one of a finite set of values"),t()(),n(149,"h4",17)(150,"span"),e(151,"Code first"),t()(),n(152,"p"),e(153,"When using the code first approach, you define a GraphQL enum type by simply creating a TypeScript enum."),t(),n(154,"app-copy-button")(155,"pre")(156,"code",9),e(157,`
export enum AllowedColor {
  RED,
  GREEN,
  BLUE,
}
`),t()()(),n(158,"p"),e(159,"With this in place, register the "),n(160,"code"),e(161,"AllowedColor"),t(),e(162," enum using the "),n(163,"code"),e(164,"registerEnumType"),t(),e(165," function exported from the "),n(166,"code"),e(167,"@nestjs/graphql"),t(),e(168," package:"),t(),n(169,"app-copy-button")(170,"pre")(171,"code",9),e(172,`
registerEnumType(AllowedColor, {
  name: 'AllowedColor',
});
`),t()()(),n(173,"p"),e(174,"Now you can reference the "),n(175,"code"),e(176,"AllowedColor"),t(),e(177," in our types:"),t(),n(178,"app-copy-button")(179,"pre")(180,"code",9),e(181,`
@Field(type => AllowedColor)
favoriteColor: AllowedColor;
`),t()()(),n(182,"p"),e(183,"This will result in generating the following part of the GraphQL schema in SDL:"),t(),n(184,"pre")(185,"code",11),e(186,`
enum AllowedColor {
  RED
  GREEN
  BLUE
}
`),t()(),n(187,"p"),e(188,"To provide a description for the enum, pass the "),n(189,"code"),e(190,"description"),t(),e(191," property into the "),n(192,"code"),e(193,"registerEnumType()"),t(),e(194," function."),t(),n(195,"app-copy-button")(196,"pre")(197,"code",9),e(198,`
registerEnumType(AllowedColor, {
  name: 'AllowedColor',
  description: 'The supported colors.',
});
`),t()()(),n(199,"p"),e(200,"To provide a description for the enum values, or to mark a value as deprecated, pass the "),n(201,"code"),e(202,"valuesMap"),t(),e(203," property, as follows:"),t(),n(204,"app-copy-button")(205,"pre")(206,"code",9),e(207,`
registerEnumType(AllowedColor, {
  name: 'AllowedColor',
  description: 'The supported colors.',
  valuesMap: {
    RED: {
      description: 'The default color.',
    },
    BLUE: {
      deprecationReason: 'Too blue.',
    },
  },
});
`),t()()(),n(208,"p"),e(209,"This will generate the following GraphQL schema in SDL:"),t(),n(210,"pre")(211,"code",11),e(212,`
"""
The supported colors.
"""
enum AllowedColor {
  """
  The default color.
  """
  RED
  GREEN
  BLUE @deprecated(reason: "Too blue.")
}
`),t()(),n(213,"h4",18)(214,"span"),e(215,"Schema first"),t()(),n(216,"p"),e(217,"To define an enumerator in the schema first approach, simply create a GraphQL enum with SDL."),t(),n(218,"pre")(219,"code",11),e(220,`
enum AllowedColor {
  RED
  GREEN
  BLUE
}
`),t()(),n(221,"p"),e(222,"Then you can use the typings generation feature (as shown in the "),n(223,"a",13),e(224,"quick start"),t(),e(225," chapter) to generate corresponding TypeScript definitions:"),t(),n(226,"app-copy-button")(227,"pre")(228,"code",9),e(229,`
export enum AllowedColor {
  RED
  GREEN
  BLUE
}
`),t()()(),n(230,"p"),e(231,"Sometimes a backend forces a different value for an enum internally than in the public API. In this example the API contains "),n(232,"code"),e(233,"RED"),t(),e(234,", however in resolvers we may use "),n(235,"code"),e(236,"#f00"),t(),e(237," instead (read more "),n(238,"a",19),e(239,"here"),t(),e(240,"). To accomplish this, declare a resolver object for the "),n(241,"code"),e(242,"AllowedColor"),t(),e(243," enum:"),t(),n(244,"app-copy-button")(245,"pre")(246,"code",9),e(247,`
export const allowedColorResolver: Record<keyof typeof AllowedColor, any> = {
  RED: '#f00',
};
`),t()()(),n(248,"blockquote",14)(249,"strong"),e(250,"Hint"),t(),e(251," All decorators are exported from the "),n(252,"code"),e(253,"@nestjs/graphql"),t(),e(254,` package.
`),t(),n(255,"p"),e(256,"Then use this resolver object together with the "),n(257,"code"),e(258,"resolvers"),t(),e(259," property of the "),n(260,"code"),e(261,"GraphQLModule#forRoot()"),t(),e(262," method, as follows:"),t(),n(263,"app-copy-button")(264,"pre")(265,"code",9),e(266,`
GraphQLModule.forRoot({
  resolvers: {
    AllowedColor: allowedColorResolver,
  },
});
`),t()()()())},dependencies:[c,h,x],encapsulation:2,changeDetection:0})}return i})();var ln=[{path:"quick-start",component:O,data:{title:"GraphQL + TypeScript"}},{path:"resolvers-map",redirectTo:"resolvers"},{path:"resolvers",component:H,data:{title:"GraphQL + TypeScript - Resolvers"}},{path:"mutations",component:N,data:{title:"GraphQL + TypeScript - Mutations"}},{path:"scalars",component:W,data:{title:"GraphQL + TypeScript - Scalars"}},{path:"subscriptions",component:Y,data:{title:"GraphQL + TypeScript - Subscriptions"}},{path:"guards-interceptors",redirectTo:"other-features"},{path:"tooling",redirectTo:"other-features"},{path:"other-features",component:G,data:{title:"GraphQL + TypeScript - Other features"}},{path:"federation",component:P,data:{title:"GraphQL + TypeScript - Federation"}},{path:"directives",component:R,data:{title:"GraphQL + TypeScript - Directives"}},{path:"field-middleware",component:Q,data:{title:"GraphQL + TypeScript - Field middleware"}},{path:"complexity",component:F,data:{title:"GraphQL + TypeScript - Complexity"}},{path:"extensions",component:j,data:{title:"GraphQL + TypeScript - Extensions"}},{path:"enums",redirectTo:"unions-and-enums"},{path:"unions",redirectTo:"unions-and-enums"},{path:"unions-and-enums",component:$,data:{title:"GraphQL + TypeScript - Unions and Enums"}},{path:"plugins",component:B,data:{title:"GraphQL + TypeScript - Plugins"}},{path:"interfaces",component:M,data:{title:"GraphQL + TypeScript - Interfaces"}},{path:"sharing-models",component:z,data:{title:"GraphQL + TypeScript - Sharing models"}},{path:"mapped-types",component:U,data:{title:"GraphQL + TypeScript - Mapped types"}},{path:"cli-plugin",component:L,data:{title:"GraphQL + TypeScript - CLI Plugin"}},{path:"generating-sdl",component:J,data:{title:"GraphQL + TypeScript - Generating SDL"}}];export{ln as GRAPHQL_ROUTES};
