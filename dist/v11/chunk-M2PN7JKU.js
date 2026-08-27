import{E as s,G as g,L as p,N as m,Qa as c,Ra as h,Sa as u,V as n,W as t,X as i,la as e,qa as x,y as d}from"./chunk-IPH2CUBH.js";var E=(()=>{class o extends c{static \u0275fac=(()=>{let r;return function(l){return(r||(r=d(o)))(l||o)}})();static \u0275cmp=p({type:o,selectors:[["app-devtools-overview"]],features:[m],decls:339,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/devtools/overview.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","overview"],[1,"info"],["rel","nofollow","target","_blank","href","https://devtools.nestjs.com"],[1,"language-typescript"],[1,"language-bash"],[1,"warning"],["src","/assets/devtools/modules-graph.png"],["src","/assets/devtools/classes-graph.png"],["src","/assets/devtools/node-popup.png"],["src","/assets/devtools/subtree-view.png"],["width","1000","height","565","src",s`https://www.youtube.com/embed/bW8V-ssfnvM`,"title","YouTube video player","frameBorder","0","allow","accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share","allowFullScreen",""],["appAnchor","","id","investigating-the-cannot-resolve-dependency-error"],["src","/assets/devtools/drag-and-drop.png"],["src","/assets/devtools/partial-graph-modules-view.png"],["src","/assets/devtools/partial-graph-classes-view.png"],["appAnchor","","id","routes-explorer"],["src","/assets/devtools/routes.png"],["appAnchor","","id","sandbox"],["src","/assets/devtools/sandbox.png"],["src","/assets/devtools/sandbox-table.png"],["width","1000","height","565","src",s`https://www.youtube.com/embed/liSxEN_VXKM`,"title","YouTube video player","frameBorder","0","allow","accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share","allowFullScreen",""],["appAnchor","","id","bootstrap-performance-analyzer"],["src","/assets/devtools/bootstrap-performance.png"],["appAnchor","","id","audit"],["src","/assets/devtools/audit.png"],["appAnchor","","id","preview-static-files"]],template:function(a,l){a&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),i(4,"i",4),t()(),n(5,"h3",5),e(6,"Overview"),t(),n(7,"blockquote",6)(8,"strong"),e(9,"Hint"),t(),e(10," This chapter covers the Nest Devtools integration with the Nest framework. If you are looking for the Devtools application, please visit the "),n(11,"a",7),e(12,"Devtools"),t(),e(13,` website.
`),t(),n(14,"p"),e(15,"To start debugging your local application, open up the "),n(16,"code"),e(17,"main.ts"),t(),e(18," file and make sure to set the "),n(19,"code"),e(20,"snapshot"),t(),e(21," attribute to "),n(22,"code"),e(23,"true"),t(),e(24," in the application options object, as follows:"),t(),n(25,"app-copy-button")(26,"pre")(27,"code",8),e(28,`
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    snapshot: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
`),t()()(),n(29,"p"),e(30,"This will instruct the framework to collect necessary metadata that will let Nest Devtools visualize your application's graph."),t(),n(31,"p"),e(32,"Next up, let's install the required dependency:"),t(),n(33,"pre")(34,"code",9),e(35,`
$ npm i @nestjs/devtools-integration
`),t()(),n(36,"blockquote",10)(37,"strong"),e(38,"Warning"),t(),e(39," If you're using "),n(40,"code"),e(41,"@nestjs/graphql"),t(),e(42," package in your application, make sure to install the latest version ("),n(43,"code"),e(44,"npm i @nestjs/graphql@11"),t(),e(45,`).
`),t(),n(46,"p"),e(47,"With this dependency in place, let's open up the "),n(48,"code"),e(49,"app.module.ts"),t(),e(50," file and import the "),n(51,"code"),e(52,"DevtoolsModule"),t(),e(53," that we just installed:"),t(),n(54,"app-copy-button")(55,"pre")(56,"code",8),e(57,`
@Module({
  imports: [
    DevtoolsModule.register({
      http: process.env.NODE_ENV !== 'production',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`),t()()(),n(58,"blockquote",10)(59,"strong"),e(60,"Warning"),t(),e(61," The reason we are checking the "),n(62,"code"),e(63,"NODE_ENV"),t(),e(64,` environment variable here is that you should never use this module in production!
`),t(),n(65,"p"),e(66,"Once the "),n(67,"code"),e(68,"DevtoolsModule"),t(),e(69," is imported and your application is up and running ("),n(70,"code"),e(71,"npm run start:dev"),t(),e(72,"), you should be able to navigate to "),n(73,"a",7),e(74,"Devtools"),t(),e(75," URL and see the introspected graph."),t(),n(76,"figure"),i(77,"img",11),t(),n(78,"blockquote",6)(79,"strong"),e(80,"Hint"),t(),e(81," As you can see on the screenshot above, every module connects to the "),n(82,"code"),e(83,"InternalCoreModule"),t(),e(84,". "),n(85,"code"),e(86,"InternalCoreModule"),t(),e(87," is a global module that is always imported into the root module. Since it's registered as a global node, Nest automatically creates edges between all of the modules and the "),n(88,"code"),e(89,"InternalCoreModule"),t(),e(90,' node. Now, if you want to hide global modules from the graph, you can use the "'),n(91,"strong"),e(92,"Hide global modules"),t(),e(93,`" checkbox (in the sidebar).
`),t(),n(94,"p"),e(95,"So as we can see, "),n(96,"code"),e(97,"DevtoolsModule"),t(),e(98," makes your application expose an additional HTTP server (on port 8000) that the Devtools application will use to introspect your app."),t(),n(99,"p"),e(100,'Just to double-check that everything works as expected, change the graph view to "Classes". You should see the following screen:'),t(),n(101,"figure"),i(102,"img",12),t(),n(103,"p"),e(104,"To focus on a specific node, click on the rectangle and the graph will show a popup window with the "),n(105,"strong"),e(106,'"Focus"'),t(),e(107," button. You can also use the search bar (located in the sidebar) to find a specific node."),t(),n(108,"blockquote",6)(109,"strong"),e(110,"Hint"),t(),e(111," If you click on the "),n(112,"strong"),e(113,"Inspect"),t(),e(114," button, application will take you to the "),n(115,"code"),e(116,"/debug"),t(),e(117,` page with that specific node selected.
`),t(),n(118,"figure"),i(119,"img",13),t(),n(120,"blockquote",6)(121,"strong"),e(122,"Hint"),t(),e(123," To export a graph as an image, click on the "),n(124,"strong"),e(125,"Export as PNG"),t(),e(126,` button in the right corner of the graph.
`),t(),n(127,"p"),e(128,"Using the form controls located in the sidebar (on the left), you can control edges proximity to, for example, visualize a specific application sub-tree:"),t(),n(129,"figure"),i(130,"img",14),t(),n(131,"p"),e(132,"This can be particularly useful when you have "),n(133,"strong"),e(134,"new developers"),t(),e(135," on your team and you want to show them how your application is structured. You can also use this feature to visualize a specific module (e.g. "),n(136,"code"),e(137,"TasksModule"),t(),e(138,") and all of its dependencies, which can come in handy when you're breaking down a large application into smaller modules (for example, individual micro-services)."),t(),n(139,"p"),e(140,"You can watch this video to see the "),n(141,"strong"),e(142,"Graph Explorer"),t(),e(143," feature in action:"),t(),n(144,"figure"),i(145,"iframe",15),t(),n(146,"h4",16)(147,"span"),e(148,'Investigating the "Cannot resolve dependency" error'),t()(),n(149,"blockquote",6)(150,"strong"),e(151,"Note"),t(),e(152," This feature is supported for "),n(153,"code"),e(154,"@nestjs/core"),t(),e(155," >= "),n(156,"code"),e(157,"v9.3.10"),t(),e(158,`.
`),t(),n(159,"p"),e(160,"Probably the most common error message you might have seen is about Nest not being able to resolve dependencies of a provider. Using Nest Devtools, you can effortlessly identify the issue and learn how to resolve it."),t(),n(161,"p"),e(162,"First, open up the "),n(163,"code"),e(164,"main.ts"),t(),e(165," file and update the "),n(166,"code"),e(167,"bootstrap()"),t(),e(168," call, as follows:"),t(),n(169,"app-copy-button")(170,"pre")(171,"code",8),e(172,`
bootstrap().catch((err) => {
  fs.writeFileSync('graph.json', PartialGraphHost.toString() ?? '');
  process.exit(1);
});
`),t()()(),n(173,"p"),e(174,"Also, make sure to set the "),n(175,"code"),e(176,"abortOnError"),t(),e(177," to "),n(178,"code"),e(179,"false"),t(),e(180,":"),t(),n(181,"app-copy-button")(182,"pre")(183,"code",8),e(184,`
const app = await NestFactory.create(AppModule, {
  snapshot: true,
  abortOnError: false, // <--- THIS
});
`),t()()(),n(185,"p"),e(186,"Now every time your application fails to bootstrap due to the "),n(187,"strong"),e(188,'"Cannot resolve dependency"'),t(),e(189," error, you'll find the "),n(190,"code"),e(191,"graph.json"),t(),e(192,' (that represents a partial graph) file in the root directory. You can then drag & drop this file into Devtools (make sure to switch the current mode from "Interactive" to "Preview"):'),t(),n(193,"figure"),i(194,"img",17),t(),n(195,"p"),e(196,"Upon successful upload, you should see the following graph & dialog window:"),t(),n(197,"figure"),i(198,"img",18),t(),n(199,"p"),e(200,"As you can see, the highlighted "),n(201,"code"),e(202,"TasksModule"),t(),e(203," is the one we should look into. Also, in the dialog window you can already see some instructions on how to fix this issue."),t(),n(204,"p"),e(205,`If we switch to the "Classes" view instead, that's what we'll see:`),t(),n(206,"figure"),i(207,"img",19),t(),n(208,"p"),e(209,"This graph illustrates that the "),n(210,"code"),e(211,"DiagnosticsService"),t(),e(212," which we want to inject into the "),n(213,"code"),e(214,"TasksService"),t(),e(215," was not found in the context of the "),n(216,"code"),e(217,"TasksModule"),t(),e(218," module, and we should likely just import the "),n(219,"code"),e(220,"DiagnosticsModule"),t(),e(221," into the "),n(222,"code"),e(223,"TasksModule"),t(),e(224," module to fix this up!"),t(),n(225,"h4",20)(226,"span"),e(227,"Routes explorer"),t()(),n(228,"p"),e(229,"When you navigate to the "),n(230,"strong"),e(231,"Routes explorer"),t(),e(232," page, you should see all of the registered entrypoints:"),t(),n(233,"figure"),i(234,"img",21),t(),n(235,"blockquote",6)(236,"strong"),e(237,"Hint"),t(),e(238,` This page shows not only HTTP routes, but also all of the other entrypoints (e.g. WebSockets, gRPC, GraphQL resolvers etc.).
`),t(),n(239,"p"),e(240,"Entrypoints are grouped by their host controllers. You can also use the search bar to find a specific entrypoint."),t(),n(241,"p"),e(242,"If you click on a specific entrypoint, "),n(243,"strong"),e(244,"a flow graph"),t(),e(245," will be displayed. This graph shows the execution flow of the entrypoint (e.g. guards, interceptors, pipes, etc. bound to this route). This is particularly useful when you want to understand how the request/response cycle looks for a specific route, or when troubleshooting why a specific guard/interceptor/pipe is not being executed."),t(),n(246,"h4",22)(247,"span"),e(248,"Sandbox"),t()(),n(249,"p"),e(250,"To execute JavaScript code on the fly & interact with your application in real-time, navigate to the "),n(251,"strong"),e(252,"Sandbox"),t(),e(253," page:"),t(),n(254,"figure"),i(255,"img",23),t(),n(256,"p"),e(257,"The playground can be used to test and debug API endpoints in "),n(258,"strong"),e(259,"real-time"),t(),e(260,", allowing developers to quickly identify and fix issues without using, for example, an HTTP client. We can also bypass the authentication layer, and so we no longer need that extra step of logging in, or even a special user account for testing purposes. For event-driven applications, we can also trigger events directly from the playground, and see how the application reacts to them."),t(),n(261,"p"),e(262,"Anything that gets logged down is streamlined to the playground's console, so we can easily see what's going on."),t(),n(263,"p"),e(264,"Just execute the code "),n(265,"strong"),e(266,"on the fly"),t(),e(267," and see the results instantly, without having to rebuild the application and restart the server."),t(),n(268,"figure"),i(269,"img",24),t(),n(270,"blockquote",6)(271,"strong"),e(272,"Hint"),t(),e(273," To pretty display an array of objects, use the "),n(274,"code"),e(275,"console.table()"),t(),e(276," (or just "),n(277,"code"),e(278,"table()"),t(),e(279,`) function.
`),t(),n(280,"p"),e(281,"You can watch this video to see the "),n(282,"strong"),e(283,"Interactive Playground"),t(),e(284," feature in action:"),t(),n(285,"figure"),i(286,"iframe",25),t(),n(287,"h4",26)(288,"span"),e(289,"Bootstrap performance analyzer"),t()(),n(290,"p"),e(291,"To see a list of all class nodes (controllers, providers, enhancers, etc.) and their corresponding instantiation times, navigate to the "),n(292,"strong"),e(293,"Bootstrap performance"),t(),e(294," page:"),t(),n(295,"figure"),i(296,"img",27),t(),n(297,"p"),e(298,"This page is particularly useful when you want to identify the slowest parts of your application's bootstrap process (e.g. when you want to optimize the application's startup time which is crucial for, for example, serverless environments)."),t(),n(299,"h4",28)(300,"span"),e(301,"Audit"),t()(),n(302,"p"),e(303,"To see the auto-generated audit - errors/warnings/hints that the application came up with while analyzing your serialized graph, navigate to the "),n(304,"strong"),e(305,"Audit"),t(),e(306," page:"),t(),n(307,"figure"),i(308,"img",29),t(),n(309,"blockquote",6)(310,"strong"),e(311,"Hint"),t(),e(312,` The screenshot above doesn't show all of the available audit rules.
`),t(),n(313,"p"),e(314,"This page comes in handy when you want to identify potential issues in your application."),t(),n(315,"h4",30)(316,"span"),e(317,"Preview static files"),t()(),n(318,"p"),e(319,"To save a serialized graph to a file, use the following code:"),t(),n(320,"app-copy-button")(321,"pre")(322,"code",8),e(323,`
await app.listen(process.env.PORT ?? 3000); // OR await app.init()
fs.writeFileSync('./graph.json', app.get(SerializedGraph).toString());
`),t()()(),n(324,"blockquote",6)(325,"strong"),e(326,"Hint"),t(),n(327,"code"),e(328,"SerializedGraph"),t(),e(329," is exported from the "),n(330,"code"),e(331,"@nestjs/core"),t(),e(332,` package.
`),t(),n(333,"p"),e(334,"Then you can drag and drop/upload this file:"),t(),n(335,"figure"),i(336,"img",17),t(),n(337,"p"),e(338,"This is helpful when you want to share your graph with someone else (e.g., co-worker), or when you want to analyze it offline."),t()())},dependencies:[u,h],encapsulation:2,changeDetection:0})}return o})();var S=(()=>{class o extends c{static \u0275fac=(()=>{let r;return function(l){return(r||(r=d(o)))(l||o)}})();static \u0275cmp=p({type:o,selectors:[["app-devtools-ci-cd"]],features:[m],decls:287,vars:12,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/devtools/ci-cd.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","cicd-integration"],[1,"info"],["rel","nofollow","target","_blank","href","https://devtools.nestjs.com"],["width","1000","height","565","src",s`https://www.youtube.com/embed/r5RXcBrnEQ8`,"title","YouTube video player","frameBorder","0","allow","accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share","allowFullScreen",""],["appAnchor","","id","publishing-graphs"],[1,"language-typescript"],["src","/assets/devtools/graph-published-terminal.png"],["src","/assets/devtools/project.png"],["appAnchor","","id","reports"],["src","/assets/devtools/report.png"],["appAnchor","","id","build-preview"],["src","/assets/devtools/nodes-selection.png"],["appAnchor","","id","integrations-github-actions"],[1,"language-yaml"],["rel","nofollow","target","_blank","href","https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository"],["rel","nofollow","target","_blank","href","https://devtools.nestjs.com/settings/manage-api-keys"],["src","/assets/devtools/integrate-github-app.png"],["src","/assets/devtools/actions-preview.png"],["appAnchor","","id","integrations-gitlab-pipelines"],["appAnchor","","id","other-cicd-tools"],["rel","nofollow","target","_blank","href","https://bitbucket.org/product/features/pipelines"],["rel","nofollow","target","_blank","href","https://circleci.com/"],["rel","nofollow","target","_blank","href","https://circleci.com/docs/variables/#built-in-environment-variables"],["rel","nofollow","target","_blank","href","https://support.atlassian.com/bitbucket-cloud/docs/variables-and-secrets/"]],template:function(a,l){a&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),i(4,"i",4),t()(),n(5,"h3",5),e(6,"CI/CD integration"),t(),n(7,"blockquote",6)(8,"strong"),e(9,"Hint"),t(),e(10," This chapter covers the Nest Devtools integration with the Nest framework. If you are looking for the Devtools application, please visit the "),n(11,"a",7),e(12,"Devtools"),t(),e(13,` website.
`),t(),n(14,"p"),e(15,"CI/CD integration is available for users with the "),n(16,"strong"),e(17,"Enterprise"),t(),e(18," plan."),t(),n(19,"p"),e(20,"You can watch this video to learn why & how CI/CD integration can help you:"),t(),n(21,"figure"),i(22,"iframe",8),t(),n(23,"h4",9)(24,"span"),e(25,"Publishing graphs"),t()(),n(26,"p"),e(27,"Let's first configure the application bootstrap file ("),n(28,"code"),e(29,"main.ts"),t(),e(30,") to use the "),n(31,"code"),e(32,"GraphPublisher"),t(),e(33," class (exported from the "),n(34,"code"),e(35,"@nestjs/devtools-integration"),t(),e(36," - see previous chapter for more details), as follows:"),t(),n(37,"app-copy-button")(38,"pre")(39,"code",10),e(40,`
async function bootstrap() {
  const shouldPublishGraph = process.env.PUBLISH_GRAPH === "true";

  const app = await NestFactory.create(AppModule, {
    snapshot: true,
    preview: shouldPublishGraph,
  });

  if (shouldPublishGraph) {
    await app.init();

    const publishOptions = { ... } // NOTE: this options object will vary depending on the CI/CD provider you're using
    const graphPublisher = new GraphPublisher(app);
    await graphPublisher.publish(publishOptions);

    await app.close();
  } else {
    await app.listen(process.env.PORT ?? 3000);
  }
}
`),t()()(),n(41,"p"),e(42,"As we can see, we're using the "),n(43,"code"),e(44,"GraphPublisher"),t(),e(45," here to publish our serialized graph to the centralized registry. The "),n(46,"code"),e(47,"PUBLISH_GRAPH"),t(),e(48," is a custom environment variable that will let us control whether the graph should be published (CI/CD workflow), or not (regular application bootstrap). Also, we set the "),n(49,"code"),e(50,"preview"),t(),e(51," attribute here to "),n(52,"code"),e(53,"true"),t(),e(54,". With this flag enabled, our application will bootstrap in the preview mode - which basically means that constructors (and lifecycle hooks) of all controllers, enhancers, and providers in our application will not be executed. Note - this isn't "),n(55,"strong"),e(56,"required"),t(),e(57,", but makes things simpler for us since in this case we won't really have to connect to the database etc. when running our application in the CI/CD pipeline."),t(),n(58,"p"),e(59,"The "),n(60,"code"),e(61,"publishOptions"),t(),e(62," object will vary depending on the CI/CD provider you're using. We will provide you with instructions for the most popular CI/CD providers below, in later sections."),t(),n(63,"p"),e(64,"Once the graph is successfully published, you'll see the following output in your workflow view:"),t(),n(65,"figure"),i(66,"img",11),t(),n(67,"p"),e(68,"Every time our graph is published, we should see a new entry in the project's corresponding page:"),t(),n(69,"figure"),i(70,"img",12),t(),n(71,"h4",13)(72,"span"),e(73,"Reports"),t()(),n(74,"p"),e(75,"Devtools generate a report for every build "),n(76,"strong"),e(77,"IF"),t(),e(78," there's a corresponding snapshot already stored in the centralized registry. So for example, if you create a PR against the "),n(79,"code"),e(80,"master"),t(),e(81," branch for which the graph was already published - then the application will be able to detect differences and generate a report. Otherwise, the report will not be generated."),t(),n(82,"p"),e(83,"To see reports, navigate to the project's corresponding page (see organizations)."),t(),n(84,"figure"),i(85,"img",14),t(),n(86,"p"),e(87,"This is particularly helpful in identifying changes that may have gone unnoticed during code reviews. For instance, let's say someone has changed the scope of a "),n(88,"strong"),e(89,"deeply nested provider"),t(),e(90,". This change might not be immediately obvious to the reviewer, but with Devtools, we can easily spot such changes and make sure that they're intentional. Or if we remove a guard from a specific endpoint, it will show up as affected in the report. Now if we didn't have integration or e2e tests for that route, we might not notice that it's no longer protected, and by the time we do, it could be too late."),t(),n(91,"p"),e(92,"Similarly, if we're working on a "),n(93,"strong"),e(94,"large codebase"),t(),e(95," and we modify a module to be global, we'll see how many edges were added to the graph, and this - in most cases - is a sign that we're doing something wrong."),t(),n(96,"h4",15)(97,"span"),e(98,"Build preview"),t()(),n(99,"p"),e(100,"For every published graph we can go back in time and preview how it looked before by clicking at the "),n(101,"strong"),e(102,"Preview"),t(),e(103," button. Furthermore, if the report was generated, we should see the differences highlighted on our graph:"),t(),n(104,"ul")(105,"li"),e(106,"green nodes represent added elements"),t(),n(107,"li"),e(108,"light white nodes represent updated elements"),t(),n(109,"li"),e(110,"red nodes represent deleted elements"),t()(),n(111,"p"),e(112,"See screenshot below:"),t(),n(113,"figure"),i(114,"img",16),t(),n(115,"p"),e(116,"The ability to go back in time lets you investigate and troubleshoot the issue by comparing the current graph with the previous one. Depending on how you set things up, every pull request (or even every commit) will have a corresponding snapshot in the registry, so you can easily go back in time and see what changed. Think of Devtools as a Git but with an understanding of how Nest constructs your application graph, and with the ability to "),n(117,"strong"),e(118,"visualize"),t(),e(119," it."),t(),n(120,"h4",17)(121,"span"),e(122,"Integrations: GitHub Actions"),t()(),n(123,"p"),e(124,"First let's start from creating a new GitHub workflow in the "),n(125,"code"),e(126,".github/workflows"),t(),e(127," directory in our project and call it, for example, "),n(128,"code"),e(129,"publish-graph.yml"),t(),e(130,". Inside this file, let's use the following definition:"),t(),n(131,"pre")(132,"code",18),e(133),t()(),n(134,"p"),e(135,"Ideally, "),n(136,"code"),e(137,"DEVTOOLS_API_KEY"),t(),e(138," environment variable should be retrieved from GitHub Secrets, read more "),n(139,"a",19),e(140,"here"),t(),e(141," ."),t(),n(142,"p"),e(143,"This workflow will run per each pull request that's targeting the "),n(144,"code"),e(145,"master"),t(),e(146," branch OR in case there's a direct commit to the "),n(147,"code"),e(148,"master"),t(),e(149," branch. Feel free to align this configuration to whatever your project needs. What's essential here is that we provide necessary environment variables for our "),n(150,"code"),e(151,"GraphPublisher"),t(),e(152," class (to run)."),t(),n(153,"p"),e(154,"However, there's one variable that needs to be updated before we can start using this workflow - "),n(155,"code"),e(156,"DEVTOOLS_API_KEY"),t(),e(157,". We can generate an API key dedicated for our project on this "),n(158,"a",20),e(159,"page"),t(),e(160,"."),t(),n(161,"p"),e(162,"Lastly, let's navigate to the "),n(163,"code"),e(164,"main.ts"),t(),e(165," file again and update the "),n(166,"code"),e(167,"publishOptions"),t(),e(168," object we previously left empty."),t(),n(169,"app-copy-button")(170,"pre")(171,"code",10),e(172,`
const publishOptions = {
  apiKey: process.env.DEVTOOLS_API_KEY,
  repository: process.env.REPOSITORY_NAME,
  owner: process.env.GITHUB_REPOSITORY_OWNER,
  sha: process.env.COMMIT_SHA,
  target: process.env.TARGET_SHA,
  trigger: process.env.GITHUB_BASE_REF ? 'pull' : 'push',
  branch: process.env.BRANCH_NAME,
};
`),t()()(),n(173,"p"),e(174,"For the best developer experience, make sure to integrate the "),n(175,"strong"),e(176,"GitHub application"),t(),e(177,` for your project by clicking on the "Integrate GitHub app" button (see screenshot below). Note - this isn't required.`),t(),n(178,"figure"),i(179,"img",21),t(),n(180,"p"),e(181,"With this integration, you'll be able to see the status of the preview/report generation process right in your pull request:"),t(),n(182,"figure"),i(183,"img",22),t(),n(184,"h4",23)(185,"span"),e(186,"Integrations: Gitlab Pipelines"),t()(),n(187,"p"),e(188,"First let's start from creating a new Gitlab CI configuration file in the root directory of our project and call it, for example, "),n(189,"code"),e(190,".gitlab-ci.yml"),t(),e(191,". Inside this file, let's use the following definition:"),t(),n(192,"app-copy-button")(193,"pre")(194,"code",10),e(195,`
const publishOptions = {
  apiKey: process.env.DEVTOOLS_API_KEY,
  repository: process.env.REPOSITORY_NAME,
  owner: process.env.GITHUB_REPOSITORY_OWNER,
  sha: process.env.COMMIT_SHA,
  target: process.env.TARGET_SHA,
  trigger: process.env.GITHUB_BASE_REF ? 'pull' : 'push',
  branch: process.env.BRANCH_NAME,
};
`),t()()(),n(196,"blockquote",6)(197,"strong"),e(198,"Hint"),t(),e(199," Ideally, "),n(200,"code"),e(201,"DEVTOOLS_API_KEY"),t(),e(202,` environment variable should be retrieved from secrets.
`),t(),n(203,"p"),e(204,"This workflow will run per each pull request that's targeting the "),n(205,"code"),e(206,"master"),t(),e(207," branch OR in case there's a direct commit to the "),n(208,"code"),e(209,"master"),t(),e(210," branch. Feel free to align this configuration to whatever your project needs. What's essential here is that we provide necessary environment variables for our "),n(211,"code"),e(212,"GraphPublisher"),t(),e(213," class (to run)."),t(),n(214,"p"),e(215,"However, there's one variable (in this workflow definition) that needs to be updated before we can start using this workflow - "),n(216,"code"),e(217,"DEVTOOLS_API_KEY"),t(),e(218,". We can generate an API key dedicated for our project on this "),n(219,"strong"),e(220,"page"),t(),e(221," ."),t(),n(222,"p"),e(223,"Lastly, let's navigate to the "),n(224,"code"),e(225,"main.ts"),t(),e(226," file again and update the "),n(227,"code"),e(228,"publishOptions"),t(),e(229," object we previously left empty."),t(),n(230,"pre")(231,"code",18),e(232,`
image: node:16

stages:
  - build

cache:
  key:
    files:
      - package-lock.json
  paths:
    - node_modules/

workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      when: always
    - if: $CI_COMMIT_BRANCH == "master" && $CI_PIPELINE_SOURCE == "push"
      when: always
    - when: never

install_dependencies:
  stage: build
  script:
    - npm ci

publish_graph:
  stage: build
  needs:
    - install_dependencies
  script: npm run start
  variables:
    PUBLISH_GRAPH: 'true'
    DEVTOOLS_API_KEY: 'CHANGE_THIS_TO_YOUR_API_KEY'
`),t()(),n(233,"h4",24)(234,"span"),e(235,"Other CI/CD tools"),t()(),n(236,"p"),e(237,"Nest Devtools CI/CD integration can be used with any CI/CD tool of your choice (e.g., "),n(238,"a",25),e(239,"Bitbucket Pipelines"),t(),e(240," , "),n(241,"a",26),e(242,"CircleCI"),t(),e(243,", etc) so don't feel limited to providers we described here."),t(),n(244,"p"),e(245,"Look at the following "),n(246,"code"),e(247,"publishOptions"),t(),e(248," object configuration to understand what information is required to publish the graph for a given commit/build/PR."),t(),n(249,"app-copy-button")(250,"pre")(251,"code",10),e(252,`
const publishOptions = {
  apiKey: process.env.DEVTOOLS_API_KEY,
  repository: process.env.CI_PROJECT_NAME,
  owner: process.env.CI_PROJECT_ROOT_NAMESPACE,
  sha: process.env.CI_COMMIT_SHA,
  target: process.env.CI_MERGE_REQUEST_DIFF_BASE_SHA,
  trigger: process.env.CI_MERGE_REQUEST_DIFF_BASE_SHA ? 'pull' : 'push',
  branch: process.env.CI_COMMIT_BRANCH ?? process.env.CI_MERGE_REQUEST_SOURCE_BRANCH_NAME,
};
`),t()()(),n(253,"p"),e(254,"Most of this information is provided through CI/CD built-in environment variables (see "),n(255,"a",27),e(256,"CircleCI built-in environment list"),t(),e(257," and "),n(258,"a",28),e(259,"Bitbucket variables"),t(),e(260," )."),t(),n(261,"p"),e(262,"When it comes to the pipeline configuration for publishing graphs, we recommend using the following triggers:"),t(),n(263,"ul")(264,"li")(265,"code"),e(266,"push"),t(),e(267," event - only if the current branch represents a deployment environment, for example "),n(268,"code"),e(269,"master"),t(),e(270,", "),n(271,"code"),e(272,"main"),t(),e(273,", "),n(274,"code"),e(275,"staging"),t(),e(276,", "),n(277,"code"),e(278,"production"),t(),e(279,", etc."),t(),n(280,"li")(281,"code"),e(282,"pull request"),t(),e(283," event - always, or when the "),n(284,"strong"),e(285,"target branch"),t(),e(286," represents a deployment environment (see above)"),t()()()),a&2&&(g(133),x([`
name: Devtools

on:
  push:
    branches:
      - master
  pull_request:
    branches:
      - '*'

jobs:
  publish:
    if: github.actor!= 'dependabot[bot]'
    name: Publish graph
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '16'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Setup Environment (PR)
        if: `,"${{"," github.event_name == 'pull_request' ","}}",`
        shell: bash
        run: |
          echo "COMMIT_SHA=`,"${{"," github.event.pull_request.head.sha ","}}",`" >>\\\${GITHUB_ENV}
      - name: Setup Environment (Push)
        if: `,"${{"," github.event_name == 'push' ","}}",`
        shell: bash
        run: |
          echo "COMMIT_SHA=\\\${GITHUB_SHA}" >> \\\${GITHUB_ENV}
      - name: Publish
        run: PUBLISH_GRAPH=true npm run start
        env:
          DEVTOOLS_API_KEY: CHANGE_THIS_TO_YOUR_API_KEY
          REPOSITORY_NAME: `,"${{"," github.event.repository.name ","}}",`
          BRANCH_NAME: `,"${{"," github.head_ref || github.ref_name ","}}",`
          TARGET_SHA: `,"${{"," github.event.pull_request.base.sha ","}}",`
`]))},dependencies:[h,u],encapsulation:2,changeDetection:0})}return o})();var O=[{path:"overview",component:E,data:{title:"Devtools - Overview"}},{path:"ci-cd-integration",component:S,data:{title:"Devtools - CI/CD integration"}}];export{O as DEVTOOLS_ROUTES};
