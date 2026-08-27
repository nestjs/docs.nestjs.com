import{a as P}from"./chunk-A6GBSRU4.js";import{a as D,b as v}from"./chunk-AO7BAPTM.js";import{G as E,L as p,Ma as S,N as c,Qa as u,Ra as x,Sa as h,V as n,W as t,X as s,Y as i,Z as o,_ as f,ja as y,la as e,ma as b,na as w,ua as A,va as C,y as m}from"./chunk-IPH2CUBH.js";var T=(()=>{class a extends u{static \u0275fac=(()=>{let r;return function(d){return(r||(r=m(a)))(d||a)}})();static \u0275cmp=p({type:a,selectors:[["app-cli-plugin"]],features:[c],decls:474,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/openapi/cli-plugin.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","cli-plugin"],["rel","nofollow","target","_blank","href","https://www.typescriptlang.org/docs/handbook/decorators.html"],[1,"info"],["appAnchor","","id","overview"],[1,"language-typescript"],["href","/openapi/cli-plugin#using-the-cli-plugin"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/openapi/mapped-types"],["appAnchor","","id","comments-introspection"],[1,"language-ts"],["appAnchor","","id","using-the-cli-plugin"],["routerLink","/cli/overview"],[1,"language-javascript"],["appAnchor","","id","swc-builder"],["href","/recipes/swc#type-checking"],[1,"language-bash"],["href","/recipes/swc#monorepo-and-cli-plugins"],["appAnchor","","id","integration-with-ts-jest-e2e-tests"],[1,"language-json"],["appAnchor","","id","troubleshooting-jest-e2e-tests"]],template:function(l,d){l&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),s(4,"i",4),t()(),n(5,"h3",5),e(6,"CLI Plugin"),t(),n(7,"p")(8,"a",6),e(9,"TypeScript"),t(),e(10,"'s metadata reflection system has several limitations which make it impossible to, for instance, determine what properties a class consists of or recognize whether a given property is optional or required. However, some of these constraints can be addressed at compilation time. Nest provides a plugin that enhances the TypeScript compilation process to reduce the amount of boilerplate code required."),t(),n(11,"blockquote",7)(12,"strong"),e(13,"Hint"),t(),e(14," This plugin is "),n(15,"strong"),e(16,"opt-in"),t(),e(17,`. If you prefer, you can declare all decorators manually, or only specific decorators where you need them.
`),t(),n(18,"h4",8)(19,"span"),e(20,"Overview"),t()(),n(21,"p"),e(22,"The Swagger plugin will automatically:"),t(),n(23,"ul")(24,"li"),e(25,"annotate all DTO properties with "),n(26,"code"),e(27,"@ApiProperty"),t(),e(28," unless "),n(29,"code"),e(30,"@ApiHideProperty"),t(),e(31," is used"),t(),n(32,"li"),e(33,"set the "),n(34,"code"),e(35,"required"),t(),e(36," property depending on the question mark (e.g. "),n(37,"code"),e(38,"name?: string"),t(),e(39," will set "),n(40,"code"),e(41,"required: false"),t(),e(42,")"),t(),n(43,"li"),e(44,"set the "),n(45,"code"),e(46,"type"),t(),e(47," or "),n(48,"code"),e(49,"enum"),t(),e(50," property depending on the type (supports arrays as well)"),t(),n(51,"li"),e(52,"set the "),n(53,"code"),e(54,"default"),t(),e(55," property based on the assigned default value"),t(),n(56,"li"),e(57,"set several validation rules based on "),n(58,"code"),e(59,"class-validator"),t(),e(60," decorators (if "),n(61,"code"),e(62,"classValidatorShim"),t(),e(63," set to "),n(64,"code"),e(65,"true"),t(),e(66,")"),t(),n(67,"li"),e(68,"add a response decorator to every endpoint with a proper status and "),n(69,"code"),e(70,"type"),t(),e(71," (response model)"),t(),n(72,"li"),e(73,"generate descriptions for properties and endpoints based on comments (if "),n(74,"code"),e(75,"introspectComments"),t(),e(76," set to "),n(77,"code"),e(78,"true"),t(),e(79,")"),t(),n(80,"li"),e(81,"generate example values for properties based on comments (if "),n(82,"code"),e(83,"introspectComments"),t(),e(84," set to "),n(85,"code"),e(86,"true"),t(),e(87,")"),t()(),n(88,"p"),e(89,"Please, note that your filenames "),n(90,"strong"),e(91,"must have"),t(),e(92," one of the following suffixes: "),n(93,"code"),e(94,"['.dto.ts', '.entity.ts']"),t(),e(95," (e.g., "),n(96,"code"),e(97,"create-user.dto.ts"),t(),e(98,") in order to be analysed by the plugin."),t(),n(99,"p"),e(100,"If you are using a different suffix, you can adjust the plugin's behavior by specifying the "),n(101,"code"),e(102,"dtoFileNameSuffix"),t(),e(103," option (see below)."),t(),n(104,"p"),e(105,`Previously, if you wanted to provide an interactive experience with the Swagger UI,
you had to duplicate a lot of code to let the package know how your models/components should be declared in the specification. For example, you could define a simple `),n(106,"code"),e(107,"CreateUserDto"),t(),e(108," class as follows:"),t(),n(109,"app-copy-button")(110,"pre")(111,"code",9),e(112,`
export class CreateUserDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  password: string;

  @ApiProperty({ enum: RoleEnum, default: [], isArray: true })
  roles: RoleEnum[] = [];

  @ApiProperty({ required: false, default: true })
  isEnabled?: boolean = true;
}
`),t()()(),n(113,"p"),e(114,"While not a significant issue with medium-sized projects, it becomes verbose & hard to maintain once you have a large set of classes."),t(),n(115,"p"),e(116,"By "),n(117,"a",10),e(118,"enabling the Swagger plugin"),t(),e(119,", the above class definition can be declared simply:"),t(),n(120,"app-copy-button")(121,"pre")(122,"code",9),e(123,`
export class CreateUserDto {
  email: string;
  password: string;
  roles: RoleEnum[] = [];
  isEnabled?: boolean = true;
}
`),t()()(),n(124,"blockquote",7)(125,"strong"),e(126,"Note"),t(),e(127," The Swagger plugin will derive the @ApiProperty() annotations from the TypeScript types and class-validator decorators. This helps in clearly describing your API for the generated Swagger UI documentation. However, the validation at runtime would still be handled by class-validator decorators. So, it is required to continue using validators like "),n(128,"code"),e(129,"IsEmail()"),t(),e(130,", "),n(131,"code"),e(132,"IsNumber()"),t(),e(133,`, etc.
`),t(),n(134,"p"),e(135,"Hence, if you intend to rely on automatic annotations for generating documentations and still wish for runtime validations, then the class-validator decorators are still necessary."),t(),n(136,"blockquote",7)(137,"strong"),e(138,"Hint"),t(),e(139," When using "),n(140,"a",11),e(141,"mapped types utilities"),t(),e(142," (like "),n(143,"code"),e(144,"PartialType"),t(),e(145,") in DTOs import them from "),n(146,"code"),e(147,"@nestjs/swagger"),t(),e(148," instead of "),n(149,"code"),e(150,"@nestjs/mapped-types"),t(),e(151,` for the plugin to pick up the schema.
`),t(),n(152,"p"),e(153,"The plugin adds appropriate decorators on the fly based on the "),n(154,"strong"),e(155,"Abstract Syntax Tree"),t(),e(156,". Thus you won't have to struggle with "),n(157,"code"),e(158,"@ApiProperty"),t(),e(159," decorators scattered throughout the code."),t(),n(160,"blockquote",7)(161,"strong"),e(162,"Hint"),t(),e(163," The plugin will automatically generate any missing swagger properties, but if you need to override them, you simply set them explicitly via "),n(164,"code"),e(165,"@ApiProperty()"),t(),e(166,`.
`),t(),n(167,"h4",12)(168,"span"),e(169,"Comments introspection"),t()(),n(170,"p"),e(171,"With the comments introspection feature enabled, CLI plugin will generate descriptions and example values for properties based on comments."),t(),n(172,"p"),e(173,"For example, given an example "),n(174,"code"),e(175,"roles"),t(),e(176," property:"),t(),n(177,"app-copy-button")(178,"pre")(179,"code",9),e(180,`
/**
 * A list of user's roles
 * @example ['admin']
 */
@ApiProperty({
  description: \`A list of user's roles\`,
  example: ['admin'],
})
roles: RoleEnum[] = [];
`),t()()(),n(181,"p"),e(182,"You must duplicate both description and example values. With "),n(183,"code"),e(184,"introspectComments"),t(),e(185," enabled, the CLI plugin can extract these comments and automatically provide descriptions (and examples, if defined) for properties. Now, the above property can be declared simply as follows:"),t(),n(186,"app-copy-button")(187,"pre")(188,"code",9),e(189,`
/**
 * A list of user's roles
 * @example ['admin']
 */
roles: RoleEnum[] = [];
`),t()()(),n(190,"p"),e(191,"There are "),n(192,"code"),e(193,"dtoKeyOfComment"),t(),e(194," and "),n(195,"code"),e(196,"controllerKeyOfComment"),t(),e(197," plugin options available for customizing how the plugin assigns values to the "),n(198,"code"),e(199,"ApiProperty"),t(),e(200," and "),n(201,"code"),e(202,"ApiOperation"),t(),e(203," decorators, respectively. See the example below:"),t(),n(204,"app-copy-button")(205,"pre")(206,"code",9),e(207,`
export class SomeController {
  /**
   * Create some resource
   */
  @Post()
  create() {}
}
`),t()()(),n(208,"p"),e(209,"This is equivalent to the following instruction:"),t(),n(210,"app-copy-button")(211,"pre")(212,"code",9),e(213,`
@ApiOperation({ summary: "Create some resource" })
`),t()()(),n(214,"blockquote",7)(215,"strong"),e(216,"Hint"),t(),e(217," For models, the same logic applies but is used with the "),n(218,"code"),e(219,"ApiProperty"),t(),e(220,` decorator instead.
`),t(),n(221,"p"),e(222,"For controllers, you can provide not only a summary but also a description (remarks), tags (such as"),n(223,"code"),e(224," @deprecated"),t(),e(225,"), and response examples, like this:"),t(),n(226,"app-copy-button")(227,"pre")(228,"code",13),e(229,`
/**
 * Create a new cat
 *
 * @remarks This operation allows you to create a new cat.
 *
 * @deprecated
 * @throws {500} Something went wrong.
 * @throws {400} Bad Request.
 */
@Post()
async create(): Promise<Cat> {}
`),t()()(),n(230,"h4",14)(231,"span"),e(232,"Using the CLI plugin"),t()(),n(233,"p"),e(234,"To enable the plugin, open "),n(235,"code"),e(236,"nest-cli.json"),t(),e(237," (if you use "),n(238,"a",15),e(239,"Nest CLI"),t(),e(240,") and add the following "),n(241,"code"),e(242,"plugins"),t(),e(243," configuration:"),t(),n(244,"pre")(245,"code",16),e(246,`
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "plugins": ["@nestjs/swagger"]
  }
}
`),t()(),n(247,"p"),e(248,"You can use the "),n(249,"code"),e(250,"options"),t(),e(251," property to customize the behavior of the plugin."),t(),n(252,"pre")(253,"code",16),e(254,`
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "plugins": [
      {
        "name": "@nestjs/swagger",
        "options": {
          "classValidatorShim": false,
          "introspectComments": true,
          "skipAutoHttpCode": true
        }
      }
    ]
  }
}
`),t()(),n(255,"p"),e(256,"The "),n(257,"code"),e(258,"options"),t(),e(259," property has to fulfill the following interface:"),t(),n(260,"app-copy-button")(261,"pre")(262,"code",9),e(263,`
export interface PluginOptions {
  dtoFileNameSuffix?: string[];
  controllerFileNameSuffix?: string[];
  classValidatorShim?: boolean;
  dtoKeyOfComment?: string;
  controllerKeyOfComment?: string;
  introspectComments?: boolean;
  skipAutoHttpCode?: boolean;
  esmCompatible?: boolean;
}
`),t()()(),n(264,"table")(265,"tr")(266,"th"),e(267,"Option"),t(),n(268,"th"),e(269,"Default"),t(),n(270,"th"),e(271,"Description"),t()(),n(272,"tr")(273,"td")(274,"code"),e(275,"dtoFileNameSuffix"),t()(),n(276,"td")(277,"code"),e(278,"['.dto.ts', '.entity.ts']"),t()(),n(279,"td"),e(280,"DTO (Data Transfer Object) files suffix"),t()(),n(281,"tr")(282,"td")(283,"code"),e(284,"controllerFileNameSuffix"),t()(),n(285,"td")(286,"code"),e(287,".controller.ts"),t()(),n(288,"td"),e(289,"Controller files suffix"),t()(),n(290,"tr")(291,"td")(292,"code"),e(293,"classValidatorShim"),t()(),n(294,"td")(295,"code"),e(296,"true"),t()(),n(297,"td"),e(298,"If set to true, the module will reuse "),n(299,"code"),e(300,"class-validator"),t(),e(301," validation decorators (e.g. "),n(302,"code"),e(303,"@Max(10)"),t(),e(304," will add "),n(305,"code"),e(306,"max: 10"),t(),e(307," to schema definition) "),t()(),n(308,"tr")(309,"td")(310,"code"),e(311,"dtoKeyOfComment"),t()(),n(312,"td")(313,"code"),e(314,"'description'"),t()(),n(315,"td"),e(316,"The property key to set the comment text to on "),n(317,"code"),e(318,"ApiProperty"),t(),e(319,"."),t()(),n(320,"tr")(321,"td")(322,"code"),e(323,"controllerKeyOfComment"),t()(),n(324,"td")(325,"code"),e(326,"'summary'"),t()(),n(327,"td"),e(328,"The property key to set the comment text to on "),n(329,"code"),e(330,"ApiOperation"),t(),e(331,"."),t()(),n(332,"tr")(333,"td")(334,"code"),e(335,"introspectComments"),t()(),n(336,"td")(337,"code"),e(338,"false"),t()(),n(339,"td"),e(340,"If set to true, plugin will generate descriptions and example values for properties based on comments"),t()(),n(341,"tr")(342,"td")(343,"code"),e(344,"skipAutoHttpCode"),t()(),n(345,"td")(346,"code"),e(347,"false"),t()(),n(348,"td"),e(349,"Disables the automatic addition of "),n(350,"code"),e(351,"@HttpCode()"),t(),e(352," in controllers"),t()(),n(353,"tr")(354,"td")(355,"code"),e(356,"esmCompatible"),t()(),n(357,"td")(358,"code"),e(359,"false"),t()(),n(360,"td"),e(361,"If set to true, resolves syntax errors encountered when using ESM ("),n(362,"code"),e(363,'{ "type": "module" }'),t(),e(364,")."),t()()(),n(365,"p"),e(366,"Make sure to delete the "),n(367,"code"),e(368,"/dist"),t(),e(369,` folder and rebuild your application whenever plugin options are updated.
If you don't use the CLI but instead have a custom `),n(370,"code"),e(371,"webpack"),t(),e(372," configuration, you can use this plugin in combination with "),n(373,"code"),e(374,"ts-loader"),t(),e(375,":"),t(),n(376,"pre")(377,"code",16),e(378,`
getCustomTransformers: (program: any) => ({
  before: [require('@nestjs/swagger/plugin').before({}, program)]
}),
`),t()(),n(379,"h4",17)(380,"span"),e(381,"SWC builder"),t()(),n(382,"p"),e(383,"For standard setups (non-monorepo), to use CLI Plugins with the SWC builder, you need to enable type checking, as described "),n(384,"a",18),e(385,"here"),t(),e(386,"."),t(),n(387,"pre")(388,"code",19),e(389,`
$ nest start -b swc --type-check
`),t()(),n(390,"p"),e(391,"For monorepo setups, follow the instructions "),n(392,"a",20),e(393,"here"),t(),e(394,"."),t(),n(395,"pre")(396,"code",19),e(397,`
$ npx ts-node src/generate-metadata.ts
# OR npx ts-node apps/{YOUR_APP}/src/generate-metadata.ts
`),t()(),n(398,"p"),e(399,"Now, the serialized metadata file must be loaded by the "),n(400,"code"),e(401,"SwaggerModule#loadPluginMetadata"),t(),e(402," method, as shown below:"),t(),n(403,"app-copy-button")(404,"pre")(405,"code",9),e(406,`
import metadata from './metadata'; // <-- file auto-generated by the "PluginMetadataGenerator"

await SwaggerModule.loadPluginMetadata(metadata); // <-- here
const document = SwaggerModule.createDocument(app, config);
`),t()()(),n(407,"h4",21)(408,"span"),e(409,"Integration with "),n(410,"code"),e(411,"ts-jest"),t(),e(412," (e2e tests)"),t()(),n(413,"p"),e(414,"To run e2e tests, "),n(415,"code"),e(416,"ts-jest"),t(),e(417," compiles your source code files on the fly, in memory. This means, it doesn't use Nest CLI compiler and does not apply any plugins or perform AST transformations."),t(),n(418,"p"),e(419,"To enable the plugin, create the following file in your e2e tests directory:"),t(),n(420,"pre")(421,"code",16),e(422,`
const transformer = require('@nestjs/swagger/plugin');

module.exports.name = 'nestjs-swagger-transformer';
// you should change the version number anytime you change the configuration below - otherwise, jest will not detect changes
module.exports.version = 1;

module.exports.factory = (cs) => {
  return transformer.before(
    {
      // @nestjs/swagger/plugin options (can be empty)
    },
    cs.program, // "cs.tsCompiler.program" for older versions of Jest (<= v27)
  );
};
`),t()(),n(423,"p"),e(424,"With this in place, import AST transformer within your "),n(425,"code"),e(426,"jest"),t(),e(427," configuration file. By default (in the starter application), e2e tests configuration file is located under the "),n(428,"code"),e(429,"test"),t(),e(430," folder and is named "),n(431,"code"),e(432,"jest-e2e.json"),t(),e(433,"."),t(),n(434,"p"),e(435,"If you use "),n(436,"code"),e(437,"jest@<29"),t(),e(438,", then use the snippet below."),t(),n(439,"pre")(440,"code",22),e(441,`
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
`),t()(),n(442,"p"),e(443,"If you use "),n(444,"code"),e(445,"jest@^29"),t(),e(446,", then use the snippet below, as the previous approach got deprecated."),t(),n(447,"pre")(448,"code",22),e(449,`
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
`),t()(),n(450,"h4",23)(451,"span"),e(452,"Troubleshooting "),n(453,"code"),e(454,"jest"),t(),e(455," (e2e tests)"),t()(),n(456,"p"),e(457,"In case "),n(458,"code"),e(459,"jest"),t(),e(460," does not seem to pick up your configuration changes, it's possible that Jest has already "),n(461,"strong"),e(462,"cached"),t(),e(463," the build result. To apply the new configuration, you need to clear Jest's cache directory."),t(),n(464,"p"),e(465,"To clear the cache directory, run the following command in your NestJS project folder:"),t(),n(466,"pre")(467,"code",19),e(468,`
$ npx jest --clearCache
`),t()(),n(469,"p"),e(470,"In case the automatic cache clearance fails, you can still manually remove the cache folder with the following commands:"),t(),n(471,"pre")(472,"code",19),e(473,`
# Find jest cache directory (usually /tmp/jest_rs)
# by running the following command in your NestJS project root
$ npx jest --showConfig | grep cache
# ex result:
#   "cache": true,
#   "cacheDirectory": "/tmp/jest_rs"

# Remove or empty the Jest cache directory
$ rm -rf  <cacheDirectory value>
# ex:
# rm -rf /tmp/jest_rs
`),t()()())},dependencies:[x,h,S],encapsulation:2,changeDetection:0})}return a})();var I=(()=>{class a extends u{static \u0275fac=(()=>{let r;return function(d){return(r||(r=m(a)))(d||a)}})();static \u0275cmp=p({type:a,selectors:[["app-decorators"]],features:[c],decls:153,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/openapi/decorators.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","decorators"]],template:function(l,d){l&1&&(i(0,"div",1,0)(2,"div",2)(3,"a",3),f(4,"i",4),o()(),i(5,"h3",5),e(6,"Decorators"),o(),i(7,"p"),e(8,"All of the available OpenAPI decorators have an "),i(9,"code"),e(10,"Api"),o(),e(11," prefix to distinguish them from the core decorators. Below is a full list of the exported decorators along with a designation of the level at which the decorator may be applied."),o(),i(12,"table"),f(13,"thead"),i(14,"tbody")(15,"tr")(16,"td")(17,"code"),e(18,"@ApiBasicAuth()"),o()(),i(19,"td"),e(20,"Method / Controller"),o()(),i(21,"tr")(22,"td")(23,"code"),e(24,"@ApiBearerAuth()"),o()(),i(25,"td"),e(26,"Method / Controller"),o()(),i(27,"tr")(28,"td")(29,"code"),e(30,"@ApiBody()"),o()(),i(31,"td"),e(32,"Method"),o()(),i(33,"tr")(34,"td")(35,"code"),e(36,"@ApiConsumes()"),o()(),i(37,"td"),e(38,"Method / Controller"),o()(),i(39,"tr")(40,"td")(41,"code"),e(42,"@ApiCookieAuth()"),o()(),i(43,"td"),e(44,"Method / Controller"),o()(),i(45,"tr")(46,"td")(47,"code"),e(48,"@ApiExcludeController()"),o()(),i(49,"td"),e(50,"Controller"),o()(),i(51,"tr")(52,"td")(53,"code"),e(54,"@ApiExcludeEndpoint()"),o()(),i(55,"td"),e(56,"Method"),o()(),i(57,"tr")(58,"td")(59,"code"),e(60,"@ApiExtension()"),o()(),i(61,"td"),e(62,"Method"),o()(),i(63,"tr")(64,"td")(65,"code"),e(66,"@ApiExtraModels()"),o()(),i(67,"td"),e(68,"Method / Controller"),o()(),i(69,"tr")(70,"td")(71,"code"),e(72,"@ApiHeader()"),o()(),i(73,"td"),e(74,"Method / Controller"),o()(),i(75,"tr")(76,"td")(77,"code"),e(78,"@ApiHideProperty()"),o()(),i(79,"td"),e(80,"Model"),o()(),i(81,"tr")(82,"td")(83,"code"),e(84,"@ApiOAuth2()"),o()(),i(85,"td"),e(86,"Method / Controller"),o()(),i(87,"tr")(88,"td")(89,"code"),e(90,"@ApiOperation()"),o()(),i(91,"td"),e(92,"Method"),o()(),i(93,"tr")(94,"td")(95,"code"),e(96,"@ApiParam()"),o()(),i(97,"td"),e(98,"Method / Controller"),o()(),i(99,"tr")(100,"td")(101,"code"),e(102,"@ApiProduces()"),o()(),i(103,"td"),e(104,"Method / Controller"),o()(),i(105,"tr")(106,"td")(107,"code"),e(108,"@ApiSchema()"),o()(),i(109,"td"),e(110,"Model"),o()(),i(111,"tr")(112,"td")(113,"code"),e(114,"@ApiProperty()"),o()(),i(115,"td"),e(116,"Model"),o()(),i(117,"tr")(118,"td")(119,"code"),e(120,"@ApiPropertyOptional()"),o()(),i(121,"td"),e(122,"Model"),o()(),i(123,"tr")(124,"td")(125,"code"),e(126,"@ApiQuery()"),o()(),i(127,"td"),e(128,"Method / Controller"),o()(),i(129,"tr")(130,"td")(131,"code"),e(132,"@ApiResponse()"),o()(),i(133,"td"),e(134,"Method / Controller"),o()(),i(135,"tr")(136,"td")(137,"code"),e(138,"@ApiSecurity()"),o()(),i(139,"td"),e(140,"Method / Controller"),o()(),i(141,"tr")(142,"td")(143,"code"),e(144,"@ApiTags()"),o()(),i(145,"td"),e(146,"Method / Controller"),o()(),i(147,"tr")(148,"td")(149,"code"),e(150,"@ApiCallbacks()"),o()(),i(151,"td"),e(152,"Method / Controller"),o()()()()())},encapsulation:2,changeDetection:0})}return a})();var k=(()=>{class a extends u{static \u0275fac=(()=>{let r;return function(d){return(r||(r=m(a)))(d||a)}})();static \u0275cmp=p({type:a,selectors:[["app-introduction"]],features:[c],decls:215,vars:4,consts:[["contentReference",""],["app446342b91eea75b5aacd0f37ec9fc35a4ce06e1d",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/openapi/introduction.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","introduction"],["rel","nofollow","target","_blank","href","https://swagger.io/specification/"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/swagger"],["appAnchor","","id","installation"],[1,"language-bash"],["appAnchor","","id","bootstrap"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],[1,"info"],["rel","nofollow","target","_blank","href","https://swagger.io/specification/#openapi-document"],["href","/openapi/introduction#document-options"],["href","/openapi/introduction#setup-options"],["src","/assets/swagger1.png"],[1,"warning"],["rel","nofollow","target","_blank","href","https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP"],["appAnchor","","id","document-options"],[1,"language-TypeScript"],["appAnchor","","id","setup-options"],["rel","nofollow","target","_blank","href","http://localhost:3000/api-json"],["rel","nofollow","target","_blank","href","http://localhost:3000/api"],["appAnchor","","id","example"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/11-swagger"]],template:function(l,d){if(l&1&&(n(0,"div",2,0)(2,"div",3)(3,"a",4),s(4,"i",5),t()(),n(5,"h3",6),e(6,"Introduction"),t(),n(7,"p"),e(8,"The "),n(9,"a",7),e(10,"OpenAPI"),t(),e(11," specification is a language-agnostic definition format used to describe RESTful APIs. Nest provides a dedicated "),n(12,"a",8),e(13,"module"),t(),e(14," which allows generating such a specification by leveraging decorators."),t(),n(15,"h4",9)(16,"span"),e(17,"Installation"),t()(),n(18,"p"),e(19,"To begin using it, we first install the required dependency."),t(),n(20,"pre")(21,"code",10),e(22,`
$ npm install --save @nestjs/swagger
`),t()(),n(23,"h4",11)(24,"span"),e(25,"Bootstrap"),t()(),n(26,"p"),e(27,"Once the installation process is complete, open the "),n(28,"code"),e(29,"main.ts"),t(),e(30," file and initialize Swagger using the "),n(31,"code"),e(32,"SwaggerModule"),t(),e(33," class:"),t(),n(34,"app-copy-button",12)(35,"span",13),e(36),A(37,"extension"),s(38,"app-tabs",null,1),t(),n(40,"pre")(41,"code",14),e(42,`
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
`),t()()(),n(43,"blockquote",15)(44,"strong"),e(45,"Hint"),t(),e(46," The factory method "),n(47,"code"),e(48,"SwaggerModule.createDocument()"),t(),e(49," is used specifically to generate the Swagger document when you request it. This approach helps save some initialization time, and the resulting document is a serializable object that conforms to the "),n(50,"a",16),e(51,"OpenAPI Document"),t(),e(52,` specification. Instead of serving the document over HTTP, you can also save it as a JSON or YAML file and use it in various ways.
`),t(),n(53,"p"),e(54,"The "),n(55,"code"),e(56,"DocumentBuilder"),t(),e(57," helps to structure a base document that conforms to the OpenAPI Specification. It provides several methods that allow setting such properties as title, description, version, etc. In order to create a full document (with all HTTP routes defined) we use the "),n(58,"code"),e(59,"createDocument()"),t(),e(60," method of the "),n(61,"code"),e(62,"SwaggerModule"),t(),e(63," class. This method takes two arguments, an application instance and a Swagger options object. Alternatively, we can provide a third argument, which should be of type "),n(64,"code"),e(65,"SwaggerDocumentOptions"),t(),e(66,". More on this in the "),n(67,"a",17),e(68,"Document options section"),t(),e(69,"."),t(),n(70,"p"),e(71,"Once we create a document, we can call the "),n(72,"code"),e(73,"setup()"),t(),e(74," method. It accepts:"),t(),n(75,"ol")(76,"li"),e(77,"The path to mount the Swagger UI"),t(),n(78,"li"),e(79,"An application instance"),t(),n(80,"li"),e(81,"The document object instantiated above"),t(),n(82,"li"),e(83,"Optional configuration parameter (read more "),n(84,"a",18),e(85,"here"),t(),e(86,")"),t()(),n(87,"p"),e(88,"Now you can run the following command to start the HTTP server:"),t(),n(89,"pre")(90,"code",10),e(91,`
$ npm run start
`),t()(),n(92,"p"),e(93,"While the application is running, open your browser and navigate to "),n(94,"code"),e(95,"http://localhost:3000/api"),t(),e(96,". You should see the Swagger UI."),t(),n(97,"figure"),s(98,"img",19),t(),n(99,"p"),e(100,"As you can see, the "),n(101,"code"),e(102,"SwaggerModule"),t(),e(103," automatically reflects all of your endpoints."),t(),n(104,"blockquote",15)(105,"strong"),e(106,"Hint"),t(),e(107," To generate and download a Swagger JSON file, navigate to "),n(108,"code"),e(109,"http://localhost:3000/api-json"),t(),e(110," (assuming that your Swagger documentation is available under "),n(111,"code"),e(112,"http://localhost:3000/api"),t(),e(113,`).
It is also possible to expose it on a route of your choice using only the setup method from `),n(114,"code"),e(115,"@nestjs/swagger"),t(),e(116,`, like this:
`),n(117,"app-copy-button")(118,"pre")(119,"code",14),e(120,`
SwaggerModule.setup('swagger', app, documentFactory, {
  jsonDocumentUrl: 'swagger/json',
});
`),t()()(),n(121,"p"),e(122,"Which would expose it at "),n(123,"code"),e(124,"http://localhost:3000/swagger/json"),t()()(),n(125,"blockquote",20)(126,"strong"),e(127,"Warning"),t(),e(128," When using "),n(129,"code"),e(130,"fastify"),t(),e(131," and "),n(132,"code"),e(133,"helmet"),t(),e(134,", there may be a problem with "),n(135,"a",21),e(136,"CSP"),t(),e(137,`, to solve this collision, configure the CSP as shown below:
`),n(138,"app-copy-button")(139,"pre")(140,"code",14),e(141,`
app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: [\`'self'\`],
      styleSrc: [\`'self'\`, \`'unsafe-inline'\`],
      imgSrc: [\`'self'\`, 'data:', 'validator.swagger.io'],
      scriptSrc: [\`'self'\`, \`https:\`, \`'unsafe-inline'\`],
    },
  },
});

// If you are not going to use CSP at all, you can use this:
app.register(helmet, {
  contentSecurityPolicy: false,
});
`),t()()()(),n(142,"h4",22)(143,"span"),e(144,"Document options"),t()(),n(145,"p"),e(146,"When creating a document, it is possible to provide some extra options to fine tune the library's behavior. These options should be of type "),n(147,"code"),e(148,"SwaggerDocumentOptions"),t(),e(149,", which can be the following:"),t(),n(150,"pre")(151,"code",23),e(152,`
export interface SwaggerDocumentOptions {
  /**
   * List of modules to include in the specification
   */
  include?: Function[];

  /**
   * Additional, extra models that should be inspected and included in the specification
   */
  extraModels?: Function[];

  /**
   * If \`true\`, swagger will ignore the global prefix set through \`setGlobalPrefix()\` method
   */
  ignoreGlobalPrefix?: boolean;

  /**
   * If \`true\`, swagger will also load routes from the modules imported by \`include\` modules
   */
  deepScanRoutes?: boolean;

  /**
   * Custom operationIdFactory that will be used to generate the \`operationId\`
   * based on the \`controllerKey\`, \`methodKey\`, and version.
   * @default () => controllerKey_methodKey_version
   */
  operationIdFactory?: OperationIdFactory;

  /**
   * Custom linkNameFactory that will be used to generate the name of links
   * in the \`links\` field of responses
   *
   * @see [Link objects](https://swagger.io/docs/specification/links/)
   *
   * @default () => \`\${controllerKey}_\${methodKey}_from_\${fieldKey}\`
   */
  linkNameFactory?: (
    controllerKey: string,
    methodKey: string,
    fieldKey: string
  ) => string;

  /*
   * Generate tags automatically based on the controller name.
   * If \`false\`, you must use the \`@ApiTags()\` decorator to define tags.
   * Otherwise, the controller name without the suffix \`Controller\` will be used.
   * @default true
   */
  autoTagControllers?: boolean;
}
`),t()(),n(153,"p"),e(154,"For example, if you want to make sure that the library generates operation names like "),n(155,"code"),e(156,"createUser"),t(),e(157," instead of "),n(158,"code"),e(159,"UsersController_createUser"),t(),e(160,", you can set the following:"),t(),n(161,"pre")(162,"code",23),e(163,`
const options: SwaggerDocumentOptions =  {
  operationIdFactory: (
    controllerKey: string,
    methodKey: string
  ) => methodKey
};
const documentFactory = () => SwaggerModule.createDocument(app, config, options);
`),t()(),n(164,"h4",24)(165,"span"),e(166,"Setup options"),t()(),n(167,"p"),e(168,"You can configure Swagger UI by passing the options object which fulfills the "),n(169,"code"),e(170,"SwaggerCustomOptions"),t(),e(171," interface as a fourth argument of the "),n(172,"code"),e(173,"SwaggerModule#setup"),t(),e(174," method."),t(),n(175,"pre")(176,"code",23),e(177,`
export interface SwaggerCustomOptions {
  /**
   * If \`true\`, Swagger resources paths will be prefixed by the global prefix set through \`setGlobalPrefix()\`.
   * Default: \`false\`.
   * @see https://docs.nestjs.com/faq/global-prefix
   */
  useGlobalPrefix?: boolean;

  /**
   * If \`false\`, the Swagger UI will not be served. Only API definitions (JSON and YAML)
   * will be accessible (on \`/{path}-json\` and \`/{path}-yaml\`). To fully disable both the Swagger UI and API definitions, use \`raw: false\`.
   * Default: \`true\`.
   * @deprecated Use \`ui\` instead.
   */
  swaggerUiEnabled?: boolean;

  /**
   * If \`false\`, the Swagger UI will not be served. Only API definitions (JSON and YAML)
   * will be accessible (on \`/{path}-json\` and \`/{path}-yaml\`). To fully disable both the Swagger UI and API definitions, use \`raw: false\`.
   * Default: \`true\`.
   */
  ui?: boolean;

  /**
   * If \`true\`, raw definitions for all formats will be served.
   * Alternatively, you can pass an array to specify the formats to be served, e.g., \`raw: ['json']\` to serve only JSON definitions.
   * If omitted or set to an empty array, no definitions (JSON or YAML) will be served.
   * Use this option to control the availability of Swagger-related endpoints.
   * Default: \`true\`.
   */
  raw?: boolean | Array<'json' | 'yaml'>;

  /**
   * Url point the API definition to load in Swagger UI.
   */
  swaggerUrl?: string;

  /**
   * Path of the JSON API definition to serve.
   * Default: \`<path>-json\`.
   */
  jsonDocumentUrl?: string;

  /**
   * Path of the YAML API definition to serve.
   * Default: \`<path>-yaml\`.
   */
  yamlDocumentUrl?: string;

  /**
   * Hook allowing to alter the OpenAPI document before being served.
   * It's called after the document is generated and before it is served as JSON & YAML.
   */
  patchDocumentOnRequest?: <TRequest = any, TResponse = any>(
    req: TRequest,
    res: TResponse,
    document: OpenAPIObject
  ) => OpenAPIObject;

  /**
   * If \`true\`, the selector of OpenAPI definitions is displayed in the Swagger UI interface.
   * Default: \`false\`.
   */
  explorer?: boolean;

  /**
   * Additional Swagger UI options
   */
  swaggerOptions?: SwaggerUiOptions;

  /**
   * Custom CSS styles to inject in Swagger UI page.
   */
  customCss?: string;

  /**
   * URL(s) of a custom CSS stylesheet to load in Swagger UI page.
   */
  customCssUrl?: string | string[];

  /**
   * URL(s) of custom JavaScript files to load in Swagger UI page.
   */
  customJs?: string | string[];

  /**
   * Custom JavaScript scripts to load in Swagger UI page.
   */
  customJsStr?: string | string[];

  /**
   * Custom favicon for Swagger UI page.
   */
  customfavIcon?: string;

  /**
   * Custom title for Swagger UI page.
   */
  customSiteTitle?: string;

  /**
   * File system path (ex: ./node_modules/swagger-ui-dist) containing static Swagger UI assets.
   */
  customSwaggerUiPath?: string;

  /**
   * @deprecated This property has no effect.
   */
  validatorUrl?: string;

  /**
   * @deprecated This property has no effect.
   */
  url?: string;

  /**
   * @deprecated This property has no effect.
   */
  urls?: Record<'url' | 'name', string>[];
}
`),t()(),n(178,"blockquote",15)(179,"strong"),e(180,"Hint"),t(),n(181,"code"),e(182,"ui"),t(),e(183," and "),n(184,"code"),e(185,"raw"),t(),e(186," are independent options. Disabling Swagger UI ("),n(187,"code"),e(188,"ui: false"),t(),e(189,") does not disable API definitions (JSON/YAML). Conversely, disabling API definitions ("),n(190,"code"),e(191,"raw: []"),t(),e(192,`) does not disable the Swagger UI.
`),n(193,"p"),e(194,"For example, the following configuration will disable the Swagger UI but still allow access to API definitions:"),t(),n(195,"app-copy-button")(196,"pre")(197,"code",14),e(198,`
const options: SwaggerCustomOptions = {
  ui: false, // Swagger UI is disabled
  raw: ['json'], // JSON API definition is still accessible (YAML is disabled)
};
SwaggerModule.setup('api', app, options);
`),t()()(),n(199,"p"),e(200,"In this case, "),n(201,"a",25),e(202,"http://localhost:3000/api-json"),t(),e(203," will still be accessible, but "),n(204,"a",26),e(205,"http://localhost:3000/api"),t(),e(206," (Swagger UI) will not."),t()(),n(207,"h4",27)(208,"span"),e(209,"Example"),t()(),n(210,"p"),e(211,"A working example is available "),n(212,"a",28),e(213,"here"),t(),e(214,"."),t()()),l&2){let R=y(39);E(36),w(" ",C(37,1,"main",R.isJsActive),`
`)}},dependencies:[x,h,D,v],encapsulation:2,changeDetection:0})}return a})();var O=(()=>{class a extends u{static \u0275fac=(()=>{let r;return function(d){return(r||(r=m(a)))(d||a)}})();static \u0275cmp=p({type:a,selectors:[["app-mapped-types"]],features:[c],decls:178,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/openapi/mapped-types.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","mapped-types"],["appAnchor","","id","partial"],[1,"language-typescript"],[1,"info"],["appAnchor","","id","pick"],["appAnchor","","id","omit"],["appAnchor","","id","intersection"],["appAnchor","","id","composition"]],template:function(l,d){l&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),s(4,"i",4),t()(),n(5,"h3",5),e(6,"Mapped types"),t(),n(7,"p"),e(8,"As you build out features like "),n(9,"strong"),e(10,"CRUD"),t(),e(11," (Create/Read/Update/Delete) it's often useful to construct variants on a base entity type. Nest provides several utility functions that perform type transformations to make this task more convenient."),t(),n(12,"h4",6)(13,"span"),e(14,"Partial"),t()(),n(15,"p"),e(16,"When building input validation types (also called DTOs), it's often useful to build "),n(17,"strong"),e(18,"create"),t(),e(19," and "),n(20,"strong"),e(21,"update"),t(),e(22," variations on the same type. For example, the "),n(23,"strong"),e(24,"create"),t(),e(25," variant may require all fields, while the "),n(26,"strong"),e(27,"update"),t(),e(28," variant may make all fields optional."),t(),n(29,"p"),e(30,"Nest provides the "),n(31,"code"),e(32,"PartialType()"),t(),e(33," utility function to make this task easier and minimize boilerplate."),t(),n(34,"p"),e(35,"The "),n(36,"code"),e(37,"PartialType()"),t(),e(38," function returns a type (class) with all the properties of the input type set to optional. For example, suppose we have a "),n(39,"strong"),e(40,"create"),t(),e(41," type as follows:"),t(),n(42,"app-copy-button")(43,"pre")(44,"code",7),e(45,`
import { ApiProperty } from '@nestjs/swagger';

export class CreateCatDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  breed: string;
}
`),t()()(),n(46,"p"),e(47,"By default, all of these fields are required. To create a type with the same fields, but with each one optional, use "),n(48,"code"),e(49,"PartialType()"),t(),e(50," passing the class reference ("),n(51,"code"),e(52,"CreateCatDto"),t(),e(53,") as an argument:"),t(),n(54,"app-copy-button")(55,"pre")(56,"code",7),e(57,`
export class UpdateCatDto extends PartialType(CreateCatDto) {}
`),t()()(),n(58,"blockquote",8)(59,"strong"),e(60,"Hint"),t(),e(61," The "),n(62,"code"),e(63,"PartialType()"),t(),e(64," function is imported from the "),n(65,"code"),e(66,"@nestjs/swagger"),t(),e(67,` package.
`),t(),n(68,"h4",9)(69,"span"),e(70,"Pick"),t()(),n(71,"p"),e(72,"The "),n(73,"code"),e(74,"PickType()"),t(),e(75," function constructs a new type (class) by picking a set of properties from an input type. For example, suppose we start with a type like:"),t(),n(76,"app-copy-button")(77,"pre")(78,"code",7),e(79,`
import { ApiProperty } from '@nestjs/swagger';

export class CreateCatDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  breed: string;
}
`),t()()(),n(80,"p"),e(81,"We can pick a set of properties from this class using the "),n(82,"code"),e(83,"PickType()"),t(),e(84," utility function:"),t(),n(85,"app-copy-button")(86,"pre")(87,"code",7),e(88,`
export class UpdateCatAgeDto extends PickType(CreateCatDto, ['age'] as const) {}
`),t()()(),n(89,"blockquote",8)(90,"strong"),e(91,"Hint"),t(),e(92," The "),n(93,"code"),e(94,"PickType()"),t(),e(95," function is imported from the "),n(96,"code"),e(97,"@nestjs/swagger"),t(),e(98,` package.
`),t(),n(99,"h4",10)(100,"span"),e(101,"Omit"),t()(),n(102,"p"),e(103,"The "),n(104,"code"),e(105,"OmitType()"),t(),e(106," function constructs a type by picking all properties from an input type and then removing a particular set of keys. For example, suppose we start with a type like:"),t(),n(107,"app-copy-button")(108,"pre")(109,"code",7),e(110,`
import { ApiProperty } from '@nestjs/swagger';

export class CreateCatDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  breed: string;
}
`),t()()(),n(111,"p"),e(112,"We can generate a derived type that has every property "),n(113,"strong"),e(114,"except"),t(),n(115,"code"),e(116,"name"),t(),e(117," as shown below. In this construct, the second argument to "),n(118,"code"),e(119,"OmitType"),t(),e(120," is an array of property names."),t(),n(121,"app-copy-button")(122,"pre")(123,"code",7),e(124,`
export class UpdateCatDto extends OmitType(CreateCatDto, ['name'] as const) {}
`),t()()(),n(125,"blockquote",8)(126,"strong"),e(127,"Hint"),t(),e(128," The "),n(129,"code"),e(130,"OmitType()"),t(),e(131," function is imported from the "),n(132,"code"),e(133,"@nestjs/swagger"),t(),e(134,` package.
`),t(),n(135,"h4",11)(136,"span"),e(137,"Intersection"),t()(),n(138,"p"),e(139,"The "),n(140,"code"),e(141,"IntersectionType()"),t(),e(142," function combines two types into one new type (class). For example, suppose we start with two types like:"),t(),n(143,"app-copy-button")(144,"pre")(145,"code",7),e(146,`
import { ApiProperty } from '@nestjs/swagger';

export class CreateCatDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  breed: string;
}

export class AdditionalCatInfo {
  @ApiProperty()
  color: string;
}
`),t()()(),n(147,"p"),e(148,"We can generate a new type that combines all properties in both types."),t(),n(149,"app-copy-button")(150,"pre")(151,"code",7),e(152,`
export class UpdateCatDto extends IntersectionType(
  CreateCatDto,
  AdditionalCatInfo,
) {}
`),t()()(),n(153,"blockquote",8)(154,"strong"),e(155,"Hint"),t(),e(156," The "),n(157,"code"),e(158,"IntersectionType()"),t(),e(159," function is imported from the "),n(160,"code"),e(161,"@nestjs/swagger"),t(),e(162,` package.
`),t(),n(163,"h4",12)(164,"span"),e(165,"Composition"),t()(),n(166,"p"),e(167,"The type mapping utility functions are composable. For example, the following will produce a type (class) that has all of the properties of the "),n(168,"code"),e(169,"CreateCatDto"),t(),e(170," type except for "),n(171,"code"),e(172,"name"),t(),e(173,", and those properties will be set to optional:"),t(),n(174,"app-copy-button")(175,"pre")(176,"code",7),e(177,`
export class UpdateCatDto extends PartialType(
  OmitType(CreateCatDto, ['name'] as const),
) {}
`),t()()()())},dependencies:[x,h],encapsulation:2,changeDetection:0})}return a})();var M=(()=>{class a extends u{static \u0275fac=(()=>{let r;return function(d){return(r||(r=m(a)))(d||a)}})();static \u0275cmp=p({type:a,selectors:[["app-openapi-operations"]],features:[c],decls:457,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/openapi/operations.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","operations"],["appAnchor","","id","tags"],[1,"language-typescript"],[1,"warning"],["appAnchor","","id","headers"],["appAnchor","","id","responses"],["src","/assets/swagger-response-type.png"],["appAnchor","","id","file-upload"],["routerLink","/techniques/file-upload"],["appAnchor","","id","extensions"],["appAnchor","","id","advanced-generic-apiresponse"],["href","/openapi/types-and-parameters#raw-definitions"],[1,"language-ts"],["href","/openapi/types-and-parameters#extra-models"],[1,"language-json"],[1,"info"]],template:function(l,d){l&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),s(4,"i",4),t()(),n(5,"h3",5),e(6,"Operations"),t(),n(7,"p"),e(8,"In OpenAPI terms, paths are endpoints (resources), such as "),n(9,"code"),e(10,"/users"),t(),e(11," or "),n(12,"code"),e(13,"/reports/summary"),t(),e(14,", that your API exposes, and operations are the HTTP methods used to manipulate these paths, such as "),n(15,"code"),e(16,"GET"),t(),e(17,", "),n(18,"code"),e(19,"POST"),t(),e(20," or "),n(21,"code"),e(22,"DELETE"),t(),e(23,"."),t(),n(24,"h4",6)(25,"span"),e(26,"Tags"),t()(),n(27,"p"),e(28,"To attach a controller to a specific tag, use the "),n(29,"code"),e(30,"@ApiTags(...tags)"),t(),e(31," decorator."),t(),n(32,"app-copy-button")(33,"pre")(34,"code",7),e(35,`
@ApiTags('cats')
@Controller('cats')
export class CatsController {}
`),t()()(),n(36,"p"),e(37,"OpenAPI 3.2 extends the Tag Object so that tags can be organized into a hierarchy and annotated with a hint about how they should be presented. To declare these relationships, define the tags up front with "),n(38,"code"),e(39,"DocumentBuilder"),t(),e(40," and pass the "),n(41,"code"),e(42,"parent"),t(),e(43," and "),n(44,"code"),e(45,"kind"),t(),e(46," options to "),n(47,"code"),e(48,"addTag()"),t(),e(49,":"),t(),n(50,"app-copy-button")(51,"pre")(52,"code",7),e(53,`
const config = new DocumentBuilder()
  .setOpenAPIVersion('3.2.0')
  .addTag('Animals', 'Everything about animals', undefined, { kind: 'nav' })
  .addTag('Cats', 'Cat operations', undefined, { parent: 'Animals' })
  .addTag('Dogs', 'Dog operations', undefined, { parent: 'Animals' })
  .build();
`),t()()(),n(54,"p"),e(55,"The "),n(56,"code"),e(57,"parent"),t(),e(58," option references another tag by name, and "),n(59,"code"),e(60,"kind"),t(),e(61," is a free-form, machine-readable string that hints how the tag should be used \u2014 commonly "),n(62,"code"),e(63,"nav"),t(),e(64,", "),n(65,"code"),e(66,"badge"),t(),e(67,", or "),n(68,"code"),e(69,"audience"),t(),e(70,"."),t(),n(71,"blockquote",8)(72,"strong"),e(73,"Warning"),t(),e(74," The "),n(75,"code"),e(76,"parent"),t(),e(77," and "),n(78,"code"),e(79,"kind"),t(),e(80," fields belong to the OpenAPI 3.2 Tag Object. You must call "),n(81,"code"),e(82,"setOpenAPIVersion('3.2.0')"),t(),e(83,", otherwise the generated document still declares "),n(84,"code"),e(85,"openapi: 3.0.0"),t(),e(86," and strict validators will reject these fields. Hierarchy fields can only be defined through "),n(87,"code"),e(88,"DocumentBuilder.addTag()"),t(),e(89,"; setting them on the "),n(90,"code"),e(91,"@ApiTags()"),t(),e(92,` decorator has no effect.
`),t(),n(93,"h4",9)(94,"span"),e(95,"Headers"),t()(),n(96,"p"),e(97,"To define custom headers that are expected as part of the request, use "),n(98,"code"),e(99,"@ApiHeader()"),t(),e(100,"."),t(),n(101,"app-copy-button")(102,"pre")(103,"code",7),e(104,`
@ApiHeader({
  name: 'X-MyHeader',
  description: 'Custom header',
})
@Controller('cats')
export class CatsController {}
`),t()()(),n(105,"h4",10)(106,"span"),e(107,"Responses"),t()(),n(108,"p"),e(109,"To define a custom HTTP response, use the "),n(110,"code"),e(111,"@ApiResponse()"),t(),e(112," decorator."),t(),n(113,"app-copy-button")(114,"pre")(115,"code",7),e(116,`
@Post()
@ApiResponse({ status: 201, description: 'The record has been successfully created.'})
@ApiResponse({ status: 403, description: 'Forbidden.'})
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
`),t()()(),n(117,"p"),e(118,"Nest provides a set of short-hand "),n(119,"strong"),e(120,"API response"),t(),e(121," decorators that inherit from the "),n(122,"code"),e(123,"@ApiResponse"),t(),e(124," decorator:"),t(),n(125,"ul")(126,"li")(127,"code"),e(128,"@ApiOkResponse()"),t()(),n(129,"li")(130,"code"),e(131,"@ApiCreatedResponse()"),t()(),n(132,"li")(133,"code"),e(134,"@ApiAcceptedResponse()"),t()(),n(135,"li")(136,"code"),e(137,"@ApiNoContentResponse()"),t()(),n(138,"li")(139,"code"),e(140,"@ApiMovedPermanentlyResponse()"),t()(),n(141,"li")(142,"code"),e(143,"@ApiFoundResponse()"),t()(),n(144,"li")(145,"code"),e(146,"@ApiBadRequestResponse()"),t()(),n(147,"li")(148,"code"),e(149,"@ApiUnauthorizedResponse()"),t()(),n(150,"li")(151,"code"),e(152,"@ApiNotFoundResponse()"),t()(),n(153,"li")(154,"code"),e(155,"@ApiForbiddenResponse()"),t()(),n(156,"li")(157,"code"),e(158,"@ApiMethodNotAllowedResponse()"),t()(),n(159,"li")(160,"code"),e(161,"@ApiNotAcceptableResponse()"),t()(),n(162,"li")(163,"code"),e(164,"@ApiRequestTimeoutResponse()"),t()(),n(165,"li")(166,"code"),e(167,"@ApiConflictResponse()"),t()(),n(168,"li")(169,"code"),e(170,"@ApiPreconditionFailedResponse()"),t()(),n(171,"li")(172,"code"),e(173,"@ApiTooManyRequestsResponse()"),t()(),n(174,"li")(175,"code"),e(176,"@ApiGoneResponse()"),t()(),n(177,"li")(178,"code"),e(179,"@ApiPayloadTooLargeResponse()"),t()(),n(180,"li")(181,"code"),e(182,"@ApiUnsupportedMediaTypeResponse()"),t()(),n(183,"li")(184,"code"),e(185,"@ApiUnprocessableEntityResponse()"),t()(),n(186,"li")(187,"code"),e(188,"@ApiInternalServerErrorResponse()"),t()(),n(189,"li")(190,"code"),e(191,"@ApiNotImplementedResponse()"),t()(),n(192,"li")(193,"code"),e(194,"@ApiBadGatewayResponse()"),t()(),n(195,"li")(196,"code"),e(197,"@ApiServiceUnavailableResponse()"),t()(),n(198,"li")(199,"code"),e(200,"@ApiGatewayTimeoutResponse()"),t()(),n(201,"li")(202,"code"),e(203,"@ApiDefaultResponse()"),t()()(),n(204,"app-copy-button")(205,"pre")(206,"code",7),e(207,`
@Post()
@ApiCreatedResponse({ description: 'The record has been successfully created.'})
@ApiForbiddenResponse({ description: 'Forbidden.'})
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
`),t()()(),n(208,"p"),e(209,"To specify a return model for a request, we must create a class and annotate all properties with the "),n(210,"code"),e(211,"@ApiProperty()"),t(),e(212," decorator."),t(),n(213,"app-copy-button")(214,"pre")(215,"code",7),e(216,`
export class Cat {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  breed: string;
}
`),t()()(),n(217,"p"),e(218,"Then the "),n(219,"code"),e(220,"Cat"),t(),e(221," model can be used in combination with the "),n(222,"code"),e(223,"type"),t(),e(224," property of the response decorator."),t(),n(225,"app-copy-button")(226,"pre")(227,"code",7),e(228,`
@ApiTags('cats')
@Controller('cats')
export class CatsController {
  @Post()
  @ApiCreatedResponse({
    description: 'The record has been successfully created.',
    type: Cat,
  })
  async create(@Body() createCatDto: CreateCatDto): Promise<Cat> {
    return this.catsService.create(createCatDto);
  }
}
`),t()()(),n(229,"p"),e(230,"Let's open the browser and verify the generated "),n(231,"code"),e(232,"Cat"),t(),e(233," model:"),t(),n(234,"figure"),s(235,"img",11),t(),n(236,"p"),e(237,"Instead of defining responses for each endpoint or controller individually, you can define a global response for all endpoints using the "),n(238,"code"),e(239,"DocumentBuilder"),t(),e(240," class. This approach is useful when you want to define a global response for all endpoints in your application (e.g., for errors like "),n(241,"code"),e(242,"401 Unauthorized"),t(),e(243," or "),n(244,"code"),e(245,"500 Internal Server Error"),t(),e(246,")."),t(),n(247,"app-copy-button")(248,"pre")(249,"code",7),e(250,`
const config = new DocumentBuilder()
  .addGlobalResponse({
    status: 500,
    description: 'Internal server error',
  })
  // other configurations
  .build();
`),t()()(),n(251,"h4",12)(252,"span"),e(253,"File upload"),t()(),n(254,"p"),e(255,"You can enable file upload for a specific method with the "),n(256,"code"),e(257,"@ApiBody"),t(),e(258," decorator together with "),n(259,"code"),e(260,"@ApiConsumes()"),t(),e(261,". Here's a full example using the "),n(262,"a",13),e(263,"File Upload"),t(),e(264," technique:"),t(),n(265,"app-copy-button")(266,"pre")(267,"code",7),e(268,`
@UseInterceptors(FileInterceptor('file'))
@ApiConsumes('multipart/form-data')
@ApiBody({
  description: 'List of cats',
  type: FileUploadDto,
})
uploadFile(@UploadedFile() file: Express.Multer.File) {}
`),t()()(),n(269,"p"),e(270,"Where "),n(271,"code"),e(272,"FileUploadDto"),t(),e(273," is defined as follows:"),t(),n(274,"app-copy-button")(275,"pre")(276,"code",7),e(277,`
class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}
`),t()()(),n(278,"p"),e(279,"To handle multiple files uploading, you can define "),n(280,"code"),e(281,"FilesUploadDto"),t(),e(282," as follows:"),t(),n(283,"app-copy-button")(284,"pre")(285,"code",7),e(286,`
class FilesUploadDto {
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  files: any[];
}
`),t()()(),n(287,"h4",14)(288,"span"),e(289,"Extensions"),t()(),n(290,"p"),e(291,"To add an Extension to a request use the "),n(292,"code"),e(293,"@ApiExtension()"),t(),e(294," decorator. The extension name must be prefixed with "),n(295,"code"),e(296,"x-"),t(),e(297,"."),t(),n(298,"app-copy-button")(299,"pre")(300,"code",7),e(301,`
@ApiExtension('x-foo', { hello: 'world' })
`),t()()(),n(302,"h4",15)(303,"span"),e(304,"Advanced: Generic "),n(305,"code"),e(306,"ApiResponse"),t()()(),n(307,"p"),e(308,"With the ability to provide "),n(309,"a",16),e(310,"Raw Definitions"),t(),e(311,", we can define Generic schema for Swagger UI. Assume we have the following DTO:"),t(),n(312,"app-copy-button")(313,"pre")(314,"code",17),e(315,`
export class PaginatedDto<TData> {
  @ApiProperty()
  total: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  offset: number;

  results: TData[];
}
`),t()()(),n(316,"p"),e(317,"We skip decorating "),n(318,"code"),e(319,"results"),t(),e(320," as we will be providing a raw definition for it later. Now, let's define another DTO and name it, for example, "),n(321,"code"),e(322,"CatDto"),t(),e(323,", as follows:"),t(),n(324,"app-copy-button")(325,"pre")(326,"code",17),e(327,`
export class CatDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  breed: string;
}
`),t()()(),n(328,"p"),e(329,"With this in place, we can define a "),n(330,"code"),e(331,"PaginatedDto<CatDto>"),t(),e(332," response, as follows:"),t(),n(333,"app-copy-button")(334,"pre")(335,"code",17),e(336,`
@ApiOkResponse({
  schema: {
    allOf: [
      { $ref: getSchemaPath(PaginatedDto) },
      {
        properties: {
          results: {
            type: 'array',
            items: { $ref: getSchemaPath(CatDto) },
          },
        },
      },
    ],
  },
})
async findAll(): Promise<PaginatedDto<CatDto>> {}
`),t()()(),n(337,"p"),e(338,"In this example, we specify that the response will have allOf "),n(339,"code"),e(340,"PaginatedDto"),t(),e(341," and the "),n(342,"code"),e(343,"results"),t(),e(344," property will be of type "),n(345,"code"),e(346,"Array<CatDto>"),t(),e(347,"."),t(),n(348,"ul")(349,"li")(350,"code"),e(351,"getSchemaPath()"),t(),e(352," function that returns the OpenAPI Schema path from within the OpenAPI Spec File for a given model."),t(),n(353,"li")(354,"code"),e(355,"allOf"),t(),e(356," is a concept that OAS 3 provides to cover various Inheritance related use-cases."),t()(),n(357,"p"),e(358,"Lastly, since "),n(359,"code"),e(360,"PaginatedDto"),t(),e(361," is not directly referenced by any controller, the "),n(362,"code"),e(363,"SwaggerModule"),t(),e(364," will not be able to generate a corresponding model definition just yet. In this case, we must add it as an "),n(365,"a",18),e(366,"Extra Model"),t(),e(367,". For example, we can use the "),n(368,"code"),e(369,"@ApiExtraModels()"),t(),e(370," decorator on the controller level, as follows:"),t(),n(371,"app-copy-button")(372,"pre")(373,"code",17),e(374,`
@Controller('cats')
@ApiExtraModels(PaginatedDto)
export class CatsController {}
`),t()()(),n(375,"p"),e(376,"If you run Swagger now, the generated "),n(377,"code"),e(378,"swagger.json"),t(),e(379," for this specific endpoint should have the following response defined:"),t(),n(380,"pre")(381,"code",19),e(382,`
"responses": {
  "200": {
    "description": "",
    "content": {
      "application/json": {
        "schema": {
          "allOf": [
            {
              "$ref": "#/components/schemas/PaginatedDto"
            },
            {
              "properties": {
                "results": {
                  "$ref": "#/components/schemas/CatDto"
                }
              }
            }
          ]
        }
      }
    }
  }
}
`),t()(),n(383,"p"),e(384,"To make it reusable, we can create a custom decorator for "),n(385,"code"),e(386,"PaginatedDto"),t(),e(387,", as follows:"),t(),n(388,"app-copy-button")(389,"pre")(390,"code",17),e(391,`
export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
) => {
  return applyDecorators(
    ApiExtraModels(PaginatedDto, model),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedDto) },
          {
            properties: {
              results: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );
};
`),t()()(),n(392,"blockquote",20)(393,"strong"),e(394,"Hint"),t(),n(395,"code"),e(396,"Type<any>"),t(),e(397," interface and "),n(398,"code"),e(399,"applyDecorators"),t(),e(400," function are imported from the "),n(401,"code"),e(402,"@nestjs/common"),t(),e(403,` package.
`),t(),n(404,"p"),e(405,"To ensure that "),n(406,"code"),e(407,"SwaggerModule"),t(),e(408," will generate a definition for our model, we must add it as an extra model, like we did earlier with the "),n(409,"code"),e(410,"PaginatedDto"),t(),e(411," in the controller."),t(),n(412,"p"),e(413,"With this in place, we can use the custom "),n(414,"code"),e(415,"@ApiPaginatedResponse()"),t(),e(416," decorator on our endpoint:"),t(),n(417,"app-copy-button")(418,"pre")(419,"code",17),e(420,`
@ApiPaginatedResponse(CatDto)
async findAll(): Promise<PaginatedDto<CatDto>> {}
`),t()()(),n(421,"p"),e(422,"For client generation tools, this approach poses an ambiguity in how the "),n(423,"code"),e(424,"PaginatedResponse<TModel>"),t(),e(425," is being generated for the client. The following snippet is an example of a client generator result for the above "),n(426,"code"),e(427,"GET /"),t(),e(428," endpoint."),t(),n(429,"app-copy-button")(430,"pre")(431,"code",7),e(432,`
// Angular
findAll(): Observable<{ total: number, limit: number, offset: number, results: CatDto[] }>
`),t()()(),n(433,"p"),e(434,"As you can see, the "),n(435,"strong"),e(436,"Return Type"),t(),e(437," here is ambiguous. To workaround this issue, you can add a "),n(438,"code"),e(439,"title"),t(),e(440," property to the "),n(441,"code"),e(442,"schema"),t(),e(443," for "),n(444,"code"),e(445,"ApiPaginatedResponse"),t(),e(446,":"),t(),n(447,"app-copy-button")(448,"pre")(449,"code",7),e(450,`
export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
) => {
  return applyDecorators(
    ApiOkResponse({
      schema: {
        title: \`PaginatedResponseOf\${model.name}\`,
        allOf: [
          // ...
        ],
      },
    }),
  );
};
`),t()()(),n(451,"p"),e(452,"Now the result of the client generator tool will become:"),t(),n(453,"app-copy-button")(454,"pre")(455,"code",17),e(456,`
// Angular
findAll(): Observable<PaginatedResponseOfCatDto>
`),t()()()())},dependencies:[x,h,S],encapsulation:2,changeDetection:0})}return a})();var j=(()=>{class a extends u{static \u0275fac=(()=>{let r;return function(d){return(r||(r=m(a)))(d||a)}})();static \u0275cmp=p({type:a,selectors:[["app-openapi-other-features"]],features:[c],decls:139,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/openapi/other-features.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","other-features"],["appAnchor","","id","global-prefix"],[1,"language-typescript"],["appAnchor","","id","global-parameters"],["appAnchor","","id","global-responses"],["appAnchor","","id","multiple-specifications"],[1,"language-bash"],["src","/assets/swagger-cats.png"],["src","/assets/swagger-dogs.png"],["appAnchor","","id","dropdown-in-the-explorer-bar"],[1,"info"],["href","/openapi/introduction#setup-options"]],template:function(l,d){l&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),s(4,"i",4),t()(),n(5,"h3",5),e(6,"Other features"),t(),n(7,"p"),e(8,"This page lists all the other available features that you may find useful."),t(),n(9,"h4",6)(10,"span"),e(11,"Global prefix"),t()(),n(12,"p"),e(13,"To ignore a global prefix for routes set through "),n(14,"code"),e(15,"setGlobalPrefix()"),t(),e(16,", use "),n(17,"code"),e(18,"ignoreGlobalPrefix"),t(),e(19,":"),t(),n(20,"app-copy-button")(21,"pre")(22,"code",7),e(23,`
const document = SwaggerModule.createDocument(app, options, {
  ignoreGlobalPrefix: true,
});
`),t()()(),n(24,"h4",8)(25,"span"),e(26,"Global parameters"),t()(),n(27,"p"),e(28,"You can define parameters for all routes using "),n(29,"code"),e(30,"DocumentBuilder"),t(),e(31,", as shown below:"),t(),n(32,"app-copy-button")(33,"pre")(34,"code",7),e(35,`
const config = new DocumentBuilder()
  .addGlobalParameters({
    name: 'tenantId',
    in: 'header',
  })
  // other configurations
  .build();
`),t()()(),n(36,"h4",9)(37,"span"),e(38,"Global responses"),t()(),n(39,"p"),e(40,"You can define global responses for all routes using "),n(41,"code"),e(42,"DocumentBuilder"),t(),e(43,". This is useful for setting up consistent responses across all endpoints in your application, such as error codes like "),n(44,"code"),e(45,"401 Unauthorized"),t(),e(46," or "),n(47,"code"),e(48,"500 Internal Server Error"),t(),e(49,"."),t(),n(50,"app-copy-button")(51,"pre")(52,"code",7),e(53,`
const config = new DocumentBuilder()
  .addGlobalResponse({
    status: 500,
    description: 'Internal server error',
  })
  // other configurations
  .build();
`),t()()(),n(54,"h4",10)(55,"span"),e(56,"Multiple specifications"),t()(),n(57,"p"),e(58,"The "),n(59,"code"),e(60,"SwaggerModule"),t(),e(61," provides a way to support multiple specifications. In other words, you can serve different documentation, with different UIs, on different endpoints."),t(),n(62,"p"),e(63,"To support multiple specifications, your application must be written with a modular approach. The "),n(64,"code"),e(65,"createDocument()"),t(),e(66," method takes a 3rd argument, "),n(67,"code"),e(68,"extraOptions"),t(),e(69,", which is an object with a property named "),n(70,"code"),e(71,"include"),t(),e(72,". The "),n(73,"code"),e(74,"include"),t(),e(75," property takes a value which is an array of modules."),t(),n(76,"p"),e(77,"You can setup multiple specifications support as shown below:"),t(),n(78,"app-copy-button")(79,"pre")(80,"code",7),e(81,`
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { CatsModule } from './cats/cats.module';
import { DogsModule } from './dogs/dogs.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * createDocument(application, configurationOptions, extraOptions);
   *
   * createDocument method takes an optional 3rd argument "extraOptions"
   * which is an object with "include" property where you can pass an Array
   * of Modules that you want to include in that Swagger Specification
   * E.g: CatsModule and DogsModule will have two separate Swagger Specifications which
   * will be exposed on two different SwaggerUI with two different endpoints.
   */

  const options = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();

  const catDocumentFactory = () =>
    SwaggerModule.createDocument(app, options, {
      include: [CatsModule],
    });
  SwaggerModule.setup('api/cats', app, catDocumentFactory);

  const secondOptions = new DocumentBuilder()
    .setTitle('Dogs example')
    .setDescription('The dogs API description')
    .setVersion('1.0')
    .addTag('dogs')
    .build();

  const dogDocumentFactory = () =>
    SwaggerModule.createDocument(app, secondOptions, {
      include: [DogsModule],
    });
  SwaggerModule.setup('api/dogs', app, dogDocumentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
`),t()()(),n(82,"p"),e(83,"Now you can start your server with the following command:"),t(),n(84,"pre")(85,"code",11),e(86,`
$ npm run start
`),t()(),n(87,"p"),e(88,"Navigate to "),n(89,"code"),e(90,"http://localhost:3000/api/cats"),t(),e(91," to see the Swagger UI for cats:"),t(),n(92,"figure"),s(93,"img",12),t(),n(94,"p"),e(95,"In turn, "),n(96,"code"),e(97,"http://localhost:3000/api/dogs"),t(),e(98," will expose the Swagger UI for dogs:"),t(),n(99,"figure"),s(100,"img",13),t(),n(101,"h4",14)(102,"span"),e(103,"Dropdown in the explorer bar"),t()(),n(104,"p"),e(105,"To enable support for multiple specifications in the dropdown menu of the explorer bar, you'll need to set "),n(106,"code"),e(107,"explorer: true"),t(),e(108," and configure "),n(109,"code"),e(110,"swaggerOptions.urls"),t(),e(111," in your "),n(112,"code"),e(113,"SwaggerCustomOptions"),t(),e(114,"."),t(),n(115,"blockquote",15)(116,"strong"),e(117,"Hint"),t(),e(118," Ensure that "),n(119,"code"),e(120,"swaggerOptions.urls"),t(),e(121," points to the JSON format of your Swagger documents! To specify the JSON document, use "),n(122,"code"),e(123,"jsonDocumentUrl"),t(),e(124," within "),n(125,"code"),e(126,"SwaggerCustomOptions"),t(),e(127,". For more setup options, check "),n(128,"a",16),e(129,"here"),t(),e(130,`.
`),t(),n(131,"p"),e(132,"Here\u2019s how to set up multiple specifications from a dropdown in the explorer bar:"),t(),n(133,"app-copy-button")(134,"pre")(135,"code",7),e(136,`
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { CatsModule } from './cats/cats.module';
import { DogsModule } from './dogs/dogs.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Main API options
  const options = new DocumentBuilder()
    .setTitle('Multiple Specifications Example')
    .setDescription('Description for multiple specifications')
    .setVersion('1.0')
    .build();

  // Create main API document
  const document = SwaggerModule.createDocument(app, options);

  // Setup main API Swagger UI with dropdown support
  SwaggerModule.setup('api', app, document, {
    explorer: true,
    swaggerOptions: {
      urls: [
        {
          name: '1. API',
          url: 'api/swagger.json',
        },
        {
          name: '2. Cats API',
          url: 'api/cats/swagger.json',
        },
        {
          name: '3. Dogs API',
          url: 'api/dogs/swagger.json',
        },
      ],
    },
    jsonDocumentUrl: '/api/swagger.json',
  });

  // Cats API options
  const catOptions = new DocumentBuilder()
    .setTitle('Cats Example')
    .setDescription('Description for the Cats API')
    .setVersion('1.0')
    .addTag('cats')
    .build();

  // Create Cats API document
  const catDocument = SwaggerModule.createDocument(app, catOptions, {
    include: [CatsModule],
  });

  // Setup Cats API Swagger UI
  SwaggerModule.setup('api/cats', app, catDocument, {
    jsonDocumentUrl: '/api/cats/swagger.json',
  });

  // Dogs API options
  const dogOptions = new DocumentBuilder()
    .setTitle('Dogs Example')
    .setDescription('Description for the Dogs API')
    .setVersion('1.0')
    .addTag('dogs')
    .build();

  // Create Dogs API document
  const dogDocument = SwaggerModule.createDocument(app, dogOptions, {
    include: [DogsModule],
  });

  // Setup Dogs API Swagger UI
  SwaggerModule.setup('api/dogs', app, dogDocument, {
    jsonDocumentUrl: '/api/dogs/swagger.json',
  });

  await app.listen(3000);
}

bootstrap();
`),t()()(),n(137,"p"),e(138,"In this example, we set up a main API along with separate specifications for Cats and Dogs, each accessible from the dropdown in the explorer bar."),t()())},dependencies:[x,h],encapsulation:2,changeDetection:0})}return a})();var B=(()=>{class a extends u{static \u0275fac=(()=>{let r;return function(d){return(r||(r=m(a)))(d||a)}})();static \u0275cmp=p({type:a,selectors:[["app-openapi-security"]],features:[c],decls:117,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/openapi/security.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","security"],[1,"language-typescript"],["appAnchor","","id","basic-authentication"],["appAnchor","","id","bearer-authentication"],["appAnchor","","id","oauth2-authentication"],["appAnchor","","id","cookie-authentication"]],template:function(l,d){l&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),s(4,"i",4),t()(),n(5,"h3",5),e(6,"Security"),t(),n(7,"p"),e(8,"To define which security mechanisms should be used for a specific operation, use the "),n(9,"code"),e(10,"@ApiSecurity()"),t(),e(11," decorator."),t(),n(12,"app-copy-button")(13,"pre")(14,"code",6),e(15,`
@ApiSecurity('basic')
@Controller('cats')
export class CatsController {}
`),t()()(),n(16,"p"),e(17,"Before you run your application, remember to add the security definition to your base document using "),n(18,"code"),e(19,"DocumentBuilder"),t(),e(20,":"),t(),n(21,"app-copy-button")(22,"pre")(23,"code",6),e(24,`
const options = new DocumentBuilder().addSecurity('basic', {
  type: 'http',
  scheme: 'basic',
});
`),t()()(),n(25,"p"),e(26,"Some of the most popular authentication techniques are built-in (e.g., "),n(27,"code"),e(28,"basic"),t(),e(29," and "),n(30,"code"),e(31,"bearer"),t(),e(32,") and therefore you don't have to define security mechanisms manually as shown above."),t(),n(33,"h4",7)(34,"span"),e(35,"Basic authentication"),t()(),n(36,"p"),e(37,"To enable basic authentication, use "),n(38,"code"),e(39,"@ApiBasicAuth()"),t(),e(40,"."),t(),n(41,"app-copy-button")(42,"pre")(43,"code",6),e(44,`
@ApiBasicAuth()
@Controller('cats')
export class CatsController {}
`),t()()(),n(45,"p"),e(46,"Before you run your application, remember to add the security definition to your base document using "),n(47,"code"),e(48,"DocumentBuilder"),t(),e(49,":"),t(),n(50,"app-copy-button")(51,"pre")(52,"code",6),e(53,`
const options = new DocumentBuilder().addBasicAuth();
`),t()()(),n(54,"h4",8)(55,"span"),e(56,"Bearer authentication"),t()(),n(57,"p"),e(58,"To enable bearer authentication, use "),n(59,"code"),e(60,"@ApiBearerAuth()"),t(),e(61,"."),t(),n(62,"app-copy-button")(63,"pre")(64,"code",6),e(65,`
@ApiBearerAuth()
@Controller('cats')
export class CatsController {}
`),t()()(),n(66,"p"),e(67,"Before you run your application, remember to add the security definition to your base document using "),n(68,"code"),e(69,"DocumentBuilder"),t(),e(70,":"),t(),n(71,"app-copy-button")(72,"pre")(73,"code",6),e(74,`
const options = new DocumentBuilder().addBearerAuth();
`),t()()(),n(75,"h4",9)(76,"span"),e(77,"OAuth2 authentication"),t()(),n(78,"p"),e(79,"To enable OAuth2, use "),n(80,"code"),e(81,"@ApiOAuth2()"),t(),e(82,"."),t(),n(83,"app-copy-button")(84,"pre")(85,"code",6),e(86,`
@ApiOAuth2(['pets:write'])
@Controller('cats')
export class CatsController {}
`),t()()(),n(87,"p"),e(88,"Before you run your application, remember to add the security definition to your base document using "),n(89,"code"),e(90,"DocumentBuilder"),t(),e(91,":"),t(),n(92,"app-copy-button")(93,"pre")(94,"code",6),e(95,`
const options = new DocumentBuilder().addOAuth2();
`),t()()(),n(96,"h4",10)(97,"span"),e(98,"Cookie authentication"),t()(),n(99,"p"),e(100,"To enable cookie authentication, use "),n(101,"code"),e(102,"@ApiCookieAuth()"),t(),e(103,"."),t(),n(104,"app-copy-button")(105,"pre")(106,"code",6),e(107,`
@ApiCookieAuth()
@Controller('cats')
export class CatsController {}
`),t()()(),n(108,"p"),e(109,"Before you run your application, remember to add the security definition to your base document using "),n(110,"code"),e(111,"DocumentBuilder"),t(),e(112,":"),t(),n(113,"app-copy-button")(114,"pre")(115,"code",6),e(116,`
const options = new DocumentBuilder().addCookieAuth('optional-session-id');
`),t()()()())},dependencies:[h,x],encapsulation:2,changeDetection:0})}return a})();var F=(()=>{class a extends u{static \u0275fac=(()=>{let r;return function(d){return(r||(r=m(a)))(d||a)}})();static \u0275cmp=p({type:a,selectors:[["app-openapi-types-parameters"]],features:[c],decls:481,vars:1,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/openapi/types-and-parameters.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","types-and-parameters"],[1,"language-typescript"],[1,"info"],["src","/assets/swagger-dto.png"],["routerLink","/openapi/cli-plugin"],["src","/assets/swagger-dto2.png"],["rel","nofollow","target","_blank","href","https://swagger.io/specification/#schemaObject"],["appAnchor","","id","arrays"],["appAnchor","","id","circular-dependencies"],["appAnchor","","id","generics-and-interfaces"],["appAnchor","","id","enums"],["src","/assets/enum_query.gif"],["src","/assets/enum_query_array.gif"],["appAnchor","","id","enums-schema"],["rel","nofollow","target","_blank","href","https://swagger.io/docs/specification/data-models/enums/"],[1,"language-yaml"],["rel","nofollow","target","_blank","href","https://github.com/RicoSuter/NSwag"],["appAnchor","","id","property-value-examples"],["appAnchor","","id","raw-definitions"],["appAnchor","","id","extra-models"],["appAnchor","","id","oneof-anyof-allof"],["rel","nofollow","target","_blank","href","https://swagger.io/docs/specification/data-models/oneof-anyof-allof-not/"],["appAnchor","","id","schema-name-and-description"]],template:function(l,d){l&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),s(4,"i",4),t()(),n(5,"h3",5),e(6,"Types and parameters"),t(),n(7,"p"),e(8,"The "),n(9,"code"),e(10,"SwaggerModule"),t(),e(11," searches for all "),n(12,"code"),e(13,"@Body()"),t(),e(14,", "),n(15,"code"),e(16,"@Query()"),t(),e(17,", and "),n(18,"code"),e(19,"@Param()"),t(),e(20," decorators in route handlers to generate the API document. It also creates corresponding model definitions by taking advantage of reflection. Consider the following code:"),t(),n(21,"app-copy-button")(22,"pre")(23,"code",6),e(24,`
@Post()
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
`),t()()(),n(25,"blockquote",7)(26,"strong"),e(27,"Hint"),t(),e(28," To explicitly set the body definition use the "),n(29,"code"),e(30,"@ApiBody()"),t(),e(31," decorator (imported from the "),n(32,"code"),e(33,"@nestjs/swagger"),t(),e(34,` package).
`),t(),n(35,"p"),e(36,"Based on the "),n(37,"code"),e(38,"CreateCatDto"),t(),e(39,", the following model definition Swagger UI will be created:"),t(),n(40,"figure"),s(41,"img",8),t(),n(42,"p"),e(43,"As you can see, the definition is empty although the class has a few declared properties. In order to make the class properties visible to the "),n(44,"code"),e(45,"SwaggerModule"),t(),e(46,", we have to either annotate them with the "),n(47,"code"),e(48,"@ApiProperty()"),t(),e(49," decorator or use the CLI plugin (read more in the "),n(50,"strong"),e(51,"Plugin"),t(),e(52," section) which will do it automatically:"),t(),n(53,"app-copy-button")(54,"pre")(55,"code",6),e(56,`
import { ApiProperty } from '@nestjs/swagger';

export class CreateCatDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  breed: string;
}
`),t()()(),n(57,"blockquote",7)(58,"strong"),e(59,"Hint"),t(),e(60," Instead of manually annotating each property, consider using the Swagger plugin (see "),n(61,"a",9),e(62,"Plugin"),t(),e(63,` section) which will automatically provide this for you.
`),t(),n(64,"p"),e(65,"Let's open the browser and verify the generated "),n(66,"code"),e(67,"CreateCatDto"),t(),e(68," model:"),t(),n(69,"figure"),s(70,"img",10),t(),n(71,"p"),e(72,"In addition, the "),n(73,"code"),e(74,"@ApiProperty()"),t(),e(75," decorator allows setting various "),n(76,"a",11),e(77,"Schema Object"),t(),e(78," properties:"),t(),n(79,"app-copy-button")(80,"pre")(81,"code",6),e(82,`
@ApiProperty({
  description: 'The age of a cat',
  minimum: 1,
  default: 1,
})
age: number;
`),t()()(),n(83,"blockquote",7)(84,"strong"),e(85,"Hint"),t(),e(86," Instead of explicitly typing the "),n(87,"code"),e(88),t(),e(89," you can use the "),n(90,"code"),e(91,"@ApiPropertyOptional()"),t(),e(92,` short-hand decorator.
`),t(),n(93,"p"),e(94,"In order to explicitly set the type of the property, use the "),n(95,"code"),e(96,"type"),t(),e(97," key:"),t(),n(98,"app-copy-button")(99,"pre")(100,"code",6),e(101,`
@ApiProperty({
  type: Number,
})
age: number;
`),t()()(),n(102,"h4",12)(103,"span"),e(104,"Arrays"),t()(),n(105,"p"),e(106,"When the property is an array, we must manually indicate the array type as shown below:"),t(),n(107,"app-copy-button")(108,"pre")(109,"code",6),e(110,`
@ApiProperty({ type: [String] })
names: string[];
`),t()()(),n(111,"blockquote",7)(112,"strong"),e(113,"Hint"),t(),e(114," Consider using the Swagger plugin (see "),n(115,"a",9),e(116,"Plugin"),t(),e(117,` section) which will automatically detect arrays.
`),t(),n(118,"p"),e(119,"Either include the type as the first element of an array (as shown above) or set the "),n(120,"code"),e(121,"isArray"),t(),e(122," property to "),n(123,"code"),e(124,"true"),t(),e(125,"."),t(),n(126,"p"),s(127,"app-banner-enterprise"),t(),n(128,"h4",13)(129,"span"),e(130,"Circular dependencies"),t()(),n(131,"p"),e(132,"When you have circular dependencies between classes, use a lazy function to provide the "),n(133,"code"),e(134,"SwaggerModule"),t(),e(135," with type information:"),t(),n(136,"app-copy-button")(137,"pre")(138,"code",6),e(139,`
@ApiProperty({ type: () => Node })
node: Node;
`),t()()(),n(140,"blockquote",7)(141,"strong"),e(142,"Hint"),t(),e(143," Consider using the Swagger plugin (see "),n(144,"a",9),e(145,"Plugin"),t(),e(146,` section) which will automatically detect circular dependencies.
`),t(),n(147,"h4",14)(148,"span"),e(149,"Generics and interfaces"),t()(),n(150,"p"),e(151,"Since TypeScript does not store metadata about generics or interfaces, when you use them in your DTOs, "),n(152,"code"),e(153,"SwaggerModule"),t(),e(154," may not be able to properly generate model definitions at runtime. For instance, the following code won't be correctly inspected by the Swagger module:"),t(),n(155,"app-copy-button")(156,"pre")(157,"code",6),e(158,`
createBulk(@Body() usersDto: CreateUserDto[])
`),t()()(),n(159,"p"),e(160,"In order to overcome this limitation, you can set the type explicitly:"),t(),n(161,"app-copy-button")(162,"pre")(163,"code",6),e(164,`
@ApiBody({ type: [CreateUserDto] })
createBulk(@Body() usersDto: CreateUserDto[])
`),t()()(),n(165,"h4",15)(166,"span"),e(167,"Enums"),t()(),n(168,"p"),e(169,"To identify an "),n(170,"code"),e(171,"enum"),t(),e(172,", we must manually set the "),n(173,"code"),e(174,"enum"),t(),e(175," property on the "),n(176,"code"),e(177,"@ApiProperty"),t(),e(178," with an array of values."),t(),n(179,"app-copy-button")(180,"pre")(181,"code",6),e(182,`
@ApiProperty({ enum: ['Admin', 'Moderator', 'User']})
role: UserRole;
`),t()()(),n(183,"p"),e(184,"Alternatively, define an actual TypeScript enum as follows:"),t(),n(185,"app-copy-button")(186,"pre")(187,"code",6),e(188,`
export enum UserRole {
  Admin = 'Admin',
  Moderator = 'Moderator',
  User = 'User',
}
`),t()()(),n(189,"p"),e(190,"You can then use the enum directly with the "),n(191,"code"),e(192,"@Query()"),t(),e(193," parameter decorator in combination with the "),n(194,"code"),e(195,"@ApiQuery()"),t(),e(196," decorator."),t(),n(197,"app-copy-button")(198,"pre")(199,"code",6),e(200,`
@ApiQuery({ name: 'role', enum: UserRole })
async filterByRole(@Query('role') role: UserRole = UserRole.User) {}
`),t()()(),n(201,"figure"),s(202,"img",16),t(),n(203,"p"),e(204,"With "),n(205,"code"),e(206,"isArray"),t(),e(207," set to "),n(208,"strong"),e(209,"true"),t(),e(210,", the "),n(211,"code"),e(212,"enum"),t(),e(213," can be selected as a "),n(214,"strong"),e(215,"multi-select"),t(),e(216,":"),t(),n(217,"figure"),s(218,"img",17),t(),n(219,"h4",18)(220,"span"),e(221,"Enums schema"),t()(),n(222,"p"),e(223,"By default, the "),n(224,"code"),e(225,"enum"),t(),e(226," property will add a raw definition of "),n(227,"a",19),e(228,"Enum"),t(),e(229," on the "),n(230,"code"),e(231,"parameter"),t(),e(232,"."),t(),n(233,"pre")(234,"code",20),e(235,`
- breed:
    type: 'string'
    enum:
      - Persian
      - Tabby
      - Siamese
`),t()(),n(236,"p"),e(237,"The above specification works fine for most cases. However, if you are utilizing a tool that takes the specification as "),n(238,"strong"),e(239,"input"),t(),e(240," and generates "),n(241,"strong"),e(242,"client-side"),t(),e(243," code, you might run into a problem with the generated code containing duplicated "),n(244,"code"),e(245,"enums"),t(),e(246,". Consider the following code snippet:"),t(),n(247,"app-copy-button")(248,"pre")(249,"code",6),e(250,`
// generated client-side code
export class CatDetail {
  breed: CatDetailEnum;
}

export class CatInformation {
  breed: CatInformationEnum;
}

export enum CatDetailEnum {
  Persian = 'Persian',
  Tabby = 'Tabby',
  Siamese = 'Siamese',
}

export enum CatInformationEnum {
  Persian = 'Persian',
  Tabby = 'Tabby',
  Siamese = 'Siamese',
}
`),t()()(),n(251,"blockquote",7)(252,"strong"),e(253,"Hint"),t(),e(254," The above snippet is generated using a tool called "),n(255,"a",21),e(256,"NSwag"),t(),e(257,`.
`),t(),n(258,"p"),e(259,"You can see that now you have two "),n(260,"code"),e(261,"enums"),t(),e(262,` that are exactly the same.
To address this issue, you can pass an `),n(263,"code"),e(264,"enumName"),t(),e(265," along with the "),n(266,"code"),e(267,"enum"),t(),e(268," property in your decorator."),t(),n(269,"app-copy-button")(270,"pre")(271,"code",6),e(272,`
export class CatDetail {
  @ApiProperty({ enum: CatBreed, enumName: 'CatBreed' })
  breed: CatBreed;
}
`),t()()(),n(273,"p"),e(274,"The "),n(275,"code"),e(276,"enumName"),t(),e(277," property enables "),n(278,"code"),e(279,"@nestjs/swagger"),t(),e(280," to turn "),n(281,"code"),e(282,"CatBreed"),t(),e(283," into its own "),n(284,"code"),e(285,"schema"),t(),e(286," which in turns makes "),n(287,"code"),e(288,"CatBreed"),t(),e(289," enum reusable. The specification will look like the following:"),t(),n(290,"pre")(291,"code",20),e(292,`
CatDetail:
  type: 'object'
  properties:
    ...
    - breed:
        schema:
          $ref: '#/components/schemas/CatBreed'
CatBreed:
  type: string
  enum:
    - Persian
    - Tabby
    - Siamese
`),t()(),n(293,"blockquote",7)(294,"strong"),e(295,"Hint"),t(),e(296," Any "),n(297,"strong"),e(298,"decorator"),t(),e(299," that takes "),n(300,"code"),e(301,"enum"),t(),e(302," as a property will also take "),n(303,"code"),e(304,"enumName"),t(),e(305,`.
`),t(),n(306,"h4",22)(307,"span"),e(308,"Property value examples"),t()(),n(309,"p"),e(310,"You can set a single example for a property by using the "),n(311,"code"),e(312,"example"),t(),e(313," key, like this:"),t(),n(314,"app-copy-button")(315,"pre")(316,"code",6),e(317,`
@ApiProperty({
  example: 'persian',
})
breed: string;
`),t()()(),n(318,"p"),e(319,"If you want to provide multiple examples, you can use the "),n(320,"code"),e(321,"examples"),t(),e(322," key by passing in an object structured like this:"),t(),n(323,"app-copy-button")(324,"pre")(325,"code",6),e(326,`
@ApiProperty({
  examples: {
    Persian: { value: 'persian' },
    Tabby: { value: 'tabby' },
    Siamese: { value: 'siamese' },
    'Scottish Fold': { value: 'scottish_fold' },
  },
})
breed: string;
`),t()()(),n(327,"h4",23)(328,"span"),e(329,"Raw definitions"),t()(),n(330,"p"),e(331,"In certain cases, such as deeply nested arrays or matrices, you may need to manually define your type:"),t(),n(332,"app-copy-button")(333,"pre")(334,"code",6),e(335,`
@ApiProperty({
  type: 'array',
  items: {
    type: 'array',
    items: {
      type: 'number',
    },
  },
})
coords: number[][];
`),t()()(),n(336,"p"),e(337,"You can also specify raw object schemas, like this:"),t(),n(338,"app-copy-button")(339,"pre")(340,"code",6),e(341,`
@ApiProperty({
  type: 'object',
  properties: {
    name: {
      type: 'string',
      example: 'Error'
    },
    status: {
      type: 'number',
      example: 400
    }
  },
  required: ['name', 'status']
})
rawDefinition: Record<string, any>;
`),t()()(),n(342,"p"),e(343,"To manually define input/output content in controller classes, use the "),n(344,"code"),e(345,"schema"),t(),e(346," property:"),t(),n(347,"app-copy-button")(348,"pre")(349,"code",6),e(350,`
@ApiBody({
  schema: {
    type: 'array',
    items: {
      type: 'array',
      items: {
        type: 'number',
      },
    },
  },
})
async create(@Body() coords: number[][]) {}
`),t()()(),n(351,"h4",24)(352,"span"),e(353,"Extra models"),t()(),n(354,"p"),e(355,"To define additional models that are not directly referenced in your controllers but should be inspected by the Swagger module, use the "),n(356,"code"),e(357,"@ApiExtraModels()"),t(),e(358," decorator:"),t(),n(359,"app-copy-button")(360,"pre")(361,"code",6),e(362,`
@ApiExtraModels(ExtraModel)
export class CreateCatDto {}
`),t()()(),n(363,"blockquote",7)(364,"strong"),e(365,"Hint"),t(),e(366," You only need to use "),n(367,"code"),e(368,"@ApiExtraModels()"),t(),e(369,` once for a specific model class.
`),t(),n(370,"p"),e(371,"Alternatively, you can pass an options object with the "),n(372,"code"),e(373,"extraModels"),t(),e(374," property specified to the "),n(375,"code"),e(376,"SwaggerModule.createDocument()"),t(),e(377," method, as follows:"),t(),n(378,"app-copy-button")(379,"pre")(380,"code",6),e(381,`
const documentFactory = () =>
  SwaggerModule.createDocument(app, options, {
    extraModels: [ExtraModel],
  });
`),t()()(),n(382,"p"),e(383,"To get a reference ("),n(384,"code"),e(385,"$ref"),t(),e(386,") to your model, use the "),n(387,"code"),e(388,"getSchemaPath(ExtraModel)"),t(),e(389," function:"),t(),n(390,"app-copy-button")(391,"pre")(392,"code",6),e(393,`
'application/vnd.api+json': {
   schema: { $ref: getSchemaPath(ExtraModel) },
},
`),t()()(),n(394,"h4",25)(395,"span"),e(396,"oneOf, anyOf, allOf"),t()(),n(397,"p"),e(398,"To combine schemas, you can use the "),n(399,"code"),e(400,"oneOf"),t(),e(401,", "),n(402,"code"),e(403,"anyOf"),t(),e(404," or "),n(405,"code"),e(406,"allOf"),t(),e(407," keywords ("),n(408,"a",26),e(409,"read more"),t(),e(410,")."),t(),n(411,"app-copy-button")(412,"pre")(413,"code",6),e(414,`
@ApiProperty({
  oneOf: [
    { $ref: getSchemaPath(Cat) },
    { $ref: getSchemaPath(Dog) },
  ],
})
pet: Cat | Dog;
`),t()()(),n(415,"p"),e(416,"If you want to define a polymorphic array (i.e., an array whose members span multiple schemas), you should use a raw definition (see above) to define your type by hand."),t(),n(417,"app-copy-button")(418,"pre")(419,"code",6),e(420,`
type Pet = Cat | Dog;

@ApiProperty({
  type: 'array',
  items: {
    oneOf: [
      { $ref: getSchemaPath(Cat) },
      { $ref: getSchemaPath(Dog) },
    ],
  },
})
pets: Pet[];
`),t()()(),n(421,"blockquote",7)(422,"strong"),e(423,"Hint"),t(),e(424," The "),n(425,"code"),e(426,"getSchemaPath()"),t(),e(427," function is imported from "),n(428,"code"),e(429,"@nestjs/swagger"),t(),e(430,`.
`),t(),n(431,"p"),e(432,"Both "),n(433,"code"),e(434,"Cat"),t(),e(435," and "),n(436,"code"),e(437,"Dog"),t(),e(438," must be defined as extra models using the "),n(439,"code"),e(440,"@ApiExtraModels()"),t(),e(441," decorator (at the class-level)."),t(),n(442,"h4",27)(443,"span"),e(444,"Schema name and description"),t()(),n(445,"p"),e(446,"As you may have noticed, the name of the generated schema is based on the name of the original model class (for example, the "),n(447,"code"),e(448,"CreateCatDto"),t(),e(449," model generates a "),n(450,"code"),e(451,"CreateCatDto"),t(),e(452," schema). If you'd like to change the schema name, you can use the "),n(453,"code"),e(454,"@ApiSchema()"),t(),e(455," decorator."),t(),n(456,"p"),e(457,"Here\u2019s an example:"),t(),n(458,"app-copy-button")(459,"pre")(460,"code",6),e(461,`
@ApiSchema({ name: 'CreateCatRequest' })
class CreateCatDto {}
`),t()()(),n(462,"p"),e(463,"The model above will be translated into the "),n(464,"code"),e(465,"CreateCatRequest"),t(),e(466," schema."),t(),n(467,"p"),e(468,"By default, no description is added to the generated schema. You can add one using the "),n(469,"code"),e(470,"description"),t(),e(471," attribute:"),t(),n(472,"app-copy-button")(473,"pre")(474,"code",6),e(475,`
@ApiSchema({ description: 'Description of the CreateCatDto schema' })
class CreateCatDto {}
`),t()()(),n(476,"p"),e(477,"That way, the description will be included in the schema, as follows:"),t(),n(478,"pre")(479,"code",20),e(480,`
schemas:
  CreateCatDto:
    type: object
    description: Description of the CreateCatDto schema
`),t()()()),l&2&&(E(88),b("@ApiProperty({ required: false })"))},dependencies:[h,S,x,P],encapsulation:2,changeDetection:0})}return a})();var Pe=[{path:"introduction",component:k,data:{title:"OpenAPI (Swagger)"}},{path:"types-and-parameters",component:F,data:{title:"Types and Parameters - OpenAPI"}},{path:"operations",component:M,data:{title:"Operations - OpenAPI"}},{path:"security",component:B,data:{title:"Security - OpenAPI"}},{path:"decorators",component:I,data:{title:"Decorators - OpenAPI"}},{path:"mapped-types",component:O,data:{title:"Mapped Types - OpenAPI"}},{path:"cli-plugin",component:T,data:{title:"CLI Plugin - OpenAPI"}},{path:"other-features",component:j,data:{title:"Other features - OpenAPI"}}];export{Pe as OPENAPI_ROUTES};
