"use strict";(self.webpackChunkdocs_nestjs_com=self.webpackChunkdocs_nestjs_com||[]).push([[410],{6410:(g,i,s)=>{s.r(i),s.d(i,{DevtoolsModule:()=>u});var F=s(177),a=s(685),h=s(445),l=s(8050),e=s(4438),p=s(4819),c=s(2469);const d=[{path:"overview",component:(()=>{class t extends l.y{static \u0275fac=(()=>{let o;return function(r){return(o||(o=e.xGo(t)))(r||t)}})();static \u0275cmp=e.VBU({type:t,selectors:[["app-devtools-overview"]],features:[e.Vt3],decls:339,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/devtools/overview.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","overview"],[1,"info"],["rel","nofollow","target","_blank","href","https://devtools.nestjs.com"],[1,"language-typescript"],[1,"language-bash"],[1,"warning"],["src","/assets/devtools/modules-graph.png"],["src","/assets/devtools/classes-graph.png"],["src","/assets/devtools/node-popup.png"],["src","/assets/devtools/subtree-view.png"],["width","1000","height","565","src",e.wXG`https://www.youtube.com/embed/bW8V-ssfnvM`,"title","YouTube video player","frameBorder","0","allow","accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share","allowFullScreen",""],["appAnchor","","id","investigating-the-cannot-resolve-dependency-error"],["src","/assets/devtools/drag-and-drop.png"],["src","/assets/devtools/partial-graph-modules-view.png"],["src","/assets/devtools/partial-graph-classes-view.png"],["appAnchor","","id","routes-explorer"],["src","/assets/devtools/routes.png"],["appAnchor","","id","sandbox"],["src","/assets/devtools/sandbox.png"],["src","/assets/devtools/sandbox-table.png"],["width","1000","height","565","src",e.wXG`https://www.youtube.com/embed/liSxEN_VXKM`,"title","YouTube video player","frameBorder","0","allow","accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share","allowFullScreen",""],["appAnchor","","id","bootstrap-performance-analyzer"],["src","/assets/devtools/bootstrap-performance.png"],["appAnchor","","id","audit"],["src","/assets/devtools/audit.png"],["appAnchor","","id","preview-static-files"]],template:function(n,r){1&n&&(e.j41(0,"div",1,0)(2,"div",2)(3,"a",3),e.nrm(4,"i",4),e.k0s()(),e.j41(5,"h3",5),e.EFF(6,"Overview"),e.k0s(),e.j41(7,"blockquote",6)(8,"strong"),e.EFF(9,"Hint"),e.k0s(),e.EFF(10," This chapter covers the Nest Devtools integration with the Nest framework. If you are looking for the Devtools application, please visit the "),e.j41(11,"a",7),e.EFF(12,"Devtools"),e.k0s(),e.EFF(13," website.\n"),e.k0s(),e.j41(14,"p"),e.EFF(15,"To start debugging your local application, open up the "),e.j41(16,"code"),e.EFF(17,"main.ts"),e.k0s(),e.EFF(18," file and make sure to set the "),e.j41(19,"code"),e.EFF(20,"snapshot"),e.k0s(),e.EFF(21," attribute to "),e.j41(22,"code"),e.EFF(23,"true"),e.k0s(),e.EFF(24," in the application options object, as follows:"),e.k0s(),e.j41(25,"app-copy-button")(26,"pre")(27,"code",8),e.EFF(28,"\nasync function bootstrap() {\n  const app = await NestFactory.create(AppModule, {\n    snapshot: true,\n  });\n  await app.listen(process.env.PORT ?? 3000);\n}\n"),e.k0s()()(),e.j41(29,"p"),e.EFF(30,"This will instruct the framework to collect necessary metadata that will let Nest Devtools visualize your application's graph."),e.k0s(),e.j41(31,"p"),e.EFF(32,"Next up, let's install the required dependency:"),e.k0s(),e.j41(33,"pre")(34,"code",9),e.EFF(35,"\n$ npm i @nestjs/devtools-integration\n"),e.k0s()(),e.j41(36,"blockquote",10)(37,"strong"),e.EFF(38,"Warning"),e.k0s(),e.EFF(39," If you're using "),e.j41(40,"code"),e.EFF(41,"@nestjs/graphql"),e.k0s(),e.EFF(42," package in your application, make sure to install the latest version ("),e.j41(43,"code"),e.EFF(44,"npm i @nestjs/graphql@11"),e.k0s(),e.EFF(45,").\n"),e.k0s(),e.j41(46,"p"),e.EFF(47,"With this dependency in place, let's open up the "),e.j41(48,"code"),e.EFF(49,"app.module.ts"),e.k0s(),e.EFF(50," file and import the "),e.j41(51,"code"),e.EFF(52,"DevtoolsModule"),e.k0s(),e.EFF(53," that we just installed:"),e.k0s(),e.j41(54,"app-copy-button")(55,"pre")(56,"code",8),e.EFF(57,"\n@Module({\n  imports: [\n    DevtoolsModule.register({\n      http: process.env.NODE_ENV !== 'production',\n    }),\n  ],\n  controllers: [AppController],\n  providers: [AppService],\n})\nexport class AppModule {}\n"),e.k0s()()(),e.j41(58,"blockquote",10)(59,"strong"),e.EFF(60,"Warning"),e.k0s(),e.EFF(61," The reason we are checking the "),e.j41(62,"code"),e.EFF(63,"NODE_ENV"),e.k0s(),e.EFF(64," environment variable here is that you should never use this module in production!\n"),e.k0s(),e.j41(65,"p"),e.EFF(66,"Once the "),e.j41(67,"code"),e.EFF(68,"DevtoolsModule"),e.k0s(),e.EFF(69," is imported and your application is up and running ("),e.j41(70,"code"),e.EFF(71,"npm run start:dev"),e.k0s(),e.EFF(72,"), you should be able to navigate to "),e.j41(73,"a",7),e.EFF(74,"Devtools"),e.k0s(),e.EFF(75," URL and see the instrospected graph."),e.k0s(),e.j41(76,"figure"),e.nrm(77,"img",11),e.k0s(),e.j41(78,"blockquote",6)(79,"strong"),e.EFF(80,"Hint"),e.k0s(),e.EFF(81," As you can see on the screenshot above, every module connects to the "),e.j41(82,"code"),e.EFF(83,"InternalCoreModule"),e.k0s(),e.EFF(84,". "),e.j41(85,"code"),e.EFF(86,"InternalCoreModule"),e.k0s(),e.EFF(87," is a global module that is always imported into the root module. Since it's registered as a global node, Nest automatically creates edges between all of the modules and the "),e.j41(88,"code"),e.EFF(89,"InternalCoreModule"),e.k0s(),e.EFF(90,' node. Now, if you want to hide global modules from the graph, you can use the "'),e.j41(91,"strong"),e.EFF(92,"Hide global modules"),e.k0s(),e.EFF(93,'" checkbox (in the sidebar).\n'),e.k0s(),e.j41(94,"p"),e.EFF(95,"So as we can see, "),e.j41(96,"code"),e.EFF(97,"DevtoolsModule"),e.k0s(),e.EFF(98," makes your application expose an additional HTTP server (on port 8000) that the Devtools application will use to introspect your app."),e.k0s(),e.j41(99,"p"),e.EFF(100,'Just to double-check that everything works as expected, change the graph view to "Classes". You should see the following screen:'),e.k0s(),e.j41(101,"figure"),e.nrm(102,"img",12),e.k0s(),e.j41(103,"p"),e.EFF(104,"To focus on a specific node, click on the rectangle and the graph will show a popup window with the "),e.j41(105,"strong"),e.EFF(106,'"Focus"'),e.k0s(),e.EFF(107," button. You can also use the search bar (located in the sidebar) to find a specific node."),e.k0s(),e.j41(108,"blockquote",6)(109,"strong"),e.EFF(110,"Hint"),e.k0s(),e.EFF(111," If you click on the "),e.j41(112,"strong"),e.EFF(113,"Inspect"),e.k0s(),e.EFF(114," button, application will take you to the "),e.j41(115,"code"),e.EFF(116,"/debug"),e.k0s(),e.EFF(117," page with that specific node selected.\n"),e.k0s(),e.j41(118,"figure"),e.nrm(119,"img",13),e.k0s(),e.j41(120,"blockquote",6)(121,"strong"),e.EFF(122,"Hint"),e.k0s(),e.EFF(123," To export a graph as an image, click on the "),e.j41(124,"strong"),e.EFF(125,"Export as PNG"),e.k0s(),e.EFF(126," button in the right corner of the graph.\n"),e.k0s(),e.j41(127,"p"),e.EFF(128,"Using the form controls located in the sidebar (on the left), you can control edges proximity to, for example, visualize a specific application sub-tree:"),e.k0s(),e.j41(129,"figure"),e.nrm(130,"img",14),e.k0s(),e.j41(131,"p"),e.EFF(132,"This can be particularly useful when you have "),e.j41(133,"strong"),e.EFF(134,"new developers"),e.k0s(),e.EFF(135," on your team and you want to show them how your application is structured. You can also use this feature to visualize a specific module (e.g. "),e.j41(136,"code"),e.EFF(137,"TasksModule"),e.k0s(),e.EFF(138,") and all of its dependencies, which can come in handy when you're breaking down a large application into smaller modules (for example, individual micro-services)."),e.k0s(),e.j41(139,"p"),e.EFF(140,"You can watch this video to see the "),e.j41(141,"strong"),e.EFF(142,"Graph Explorer"),e.k0s(),e.EFF(143," feature in action:"),e.k0s(),e.j41(144,"figure"),e.nrm(145,"iframe",15),e.k0s(),e.j41(146,"h4",16)(147,"span"),e.EFF(148,'Investigating the "Cannot resolve dependency" error'),e.k0s()(),e.j41(149,"blockquote",6)(150,"strong"),e.EFF(151,"Note"),e.k0s(),e.EFF(152," This feature is supported for "),e.j41(153,"code"),e.EFF(154,"@nestjs/core"),e.k0s(),e.EFF(155," >= "),e.j41(156,"code"),e.EFF(157,"v9.3.10"),e.k0s(),e.EFF(158,".\n"),e.k0s(),e.j41(159,"p"),e.EFF(160,"Probably the most common error message you might have seen is about Nest not being able to resolve dependencies of a provider. Using Nest Devtools, you can effortlessly identify the issue and learn how to resolve it."),e.k0s(),e.j41(161,"p"),e.EFF(162,"First, open up the "),e.j41(163,"code"),e.EFF(164,"main.ts"),e.k0s(),e.EFF(165," file and update the "),e.j41(166,"code"),e.EFF(167,"bootstrap()"),e.k0s(),e.EFF(168," call, as follows:"),e.k0s(),e.j41(169,"app-copy-button")(170,"pre")(171,"code",8),e.EFF(172,"\nbootstrap().catch((err) => {\n  fs.writeFileSync('graph.json', PartialGraphHost.toString() ?? '');\n  process.exit(1);\n});\n"),e.k0s()()(),e.j41(173,"p"),e.EFF(174,"Also, make sure to set the "),e.j41(175,"code"),e.EFF(176,"abortOnError"),e.k0s(),e.EFF(177," to "),e.j41(178,"code"),e.EFF(179,"false"),e.k0s(),e.EFF(180,":"),e.k0s(),e.j41(181,"app-copy-button")(182,"pre")(183,"code",8),e.EFF(184,"\nconst app = await NestFactory.create(AppModule, {\n  snapshot: true,\n  abortOnError: false, // <--- THIS\n});\n"),e.k0s()()(),e.j41(185,"p"),e.EFF(186,"Now every time your application fails to bootstrap due to the "),e.j41(187,"strong"),e.EFF(188,'"Cannot resolve dependency"'),e.k0s(),e.EFF(189," error, you'll find the "),e.j41(190,"code"),e.EFF(191,"graph.json"),e.k0s(),e.EFF(192,' (that represents a partial graph) file in the root directory. You can then drag & drop this file into Devtools (make sure to switch the current mode from "Interactive" to "Preview"):'),e.k0s(),e.j41(193,"figure"),e.nrm(194,"img",17),e.k0s(),e.j41(195,"p"),e.EFF(196,"Upon successful upload, you should see the following graph & dialog window:"),e.k0s(),e.j41(197,"figure"),e.nrm(198,"img",18),e.k0s(),e.j41(199,"p"),e.EFF(200,"As you can see, the highlighted "),e.j41(201,"code"),e.EFF(202,"TasksModule"),e.k0s(),e.EFF(203," is the one we should look into. Also, in the dialog window you can already see some instructions on how to fix this issue."),e.k0s(),e.j41(204,"p"),e.EFF(205,"If we switch to the \"Classes\" view instead, that's what we'll see:"),e.k0s(),e.j41(206,"figure"),e.nrm(207,"img",19),e.k0s(),e.j41(208,"p"),e.EFF(209,"This graph illustrates that the "),e.j41(210,"code"),e.EFF(211,"DiagnosticsService"),e.k0s(),e.EFF(212," which we want to inject into the "),e.j41(213,"code"),e.EFF(214,"TasksService"),e.k0s(),e.EFF(215," was not found in the context of the "),e.j41(216,"code"),e.EFF(217,"TasksModule"),e.k0s(),e.EFF(218," module, and we should likely just import the "),e.j41(219,"code"),e.EFF(220,"DiagnosticsModule"),e.k0s(),e.EFF(221," into the "),e.j41(222,"code"),e.EFF(223,"TasksModule"),e.k0s(),e.EFF(224," module to fix this up!"),e.k0s(),e.j41(225,"h4",20)(226,"span"),e.EFF(227,"Routes explorer"),e.k0s()(),e.j41(228,"p"),e.EFF(229,"When you navigate to the "),e.j41(230,"strong"),e.EFF(231,"Routes explorer"),e.k0s(),e.EFF(232," page, you should see all of the registered entrypoints:"),e.k0s(),e.j41(233,"figure"),e.nrm(234,"img",21),e.k0s(),e.j41(235,"blockquote",6)(236,"strong"),e.EFF(237,"Hint"),e.k0s(),e.EFF(238," This page shows not only HTTP routes, but also all of the other entrypoints (e.g. WebSockets, gRPC, GraphQL resolvers etc.).\n"),e.k0s(),e.j41(239,"p"),e.EFF(240,"Entrypoints are grouped by their host controllers. You can also use the search bar to find a specific entrypoint."),e.k0s(),e.j41(241,"p"),e.EFF(242,"If you click on a specific entrypoint, "),e.j41(243,"strong"),e.EFF(244,"a flow graph"),e.k0s(),e.EFF(245," will be displayed. This graph shows the execution flow of the entrypoint (e.g. guards, interceptors, pipes, etc. bound to this route). This is particularly useful when you want to understand how the request/response cycle looks for a specific route, or when troubleshooting why a specific guard/interceptor/pipe is not being executed."),e.k0s(),e.j41(246,"h4",22)(247,"span"),e.EFF(248,"Sandbox"),e.k0s()(),e.j41(249,"p"),e.EFF(250,"To execute JavaScript code on the fly & interact with your application in real-time, navigate to the "),e.j41(251,"strong"),e.EFF(252,"Sandbox"),e.k0s(),e.EFF(253," page:"),e.k0s(),e.j41(254,"figure"),e.nrm(255,"img",23),e.k0s(),e.j41(256,"p"),e.EFF(257,"The playground can be used to test and debug API endpoints in "),e.j41(258,"strong"),e.EFF(259,"real-time"),e.k0s(),e.EFF(260,", allowing developers to quickly identify and fix issues without using, for example, an HTTP client. We can also bypass the authentication layer, and so we no longer need that extra step of logging in, or even a special user account for testing purposes. For event-driven applications, we can also trigger events directly from the playground, and see how the application reacts to them."),e.k0s(),e.j41(261,"p"),e.EFF(262,"Anything that gets logged down is streamlined to the playground's console, so we can easily see what's going on."),e.k0s(),e.j41(263,"p"),e.EFF(264,"Just execute the code "),e.j41(265,"strong"),e.EFF(266,"on the fly"),e.k0s(),e.EFF(267," and see the results instantly, without having to rebuild the application and restart the server."),e.k0s(),e.j41(268,"figure"),e.nrm(269,"img",24),e.k0s(),e.j41(270,"blockquote",6)(271,"strong"),e.EFF(272,"Hint"),e.k0s(),e.EFF(273," To pretty display an array of objects, use the "),e.j41(274,"code"),e.EFF(275,"console.table()"),e.k0s(),e.EFF(276," (or just "),e.j41(277,"code"),e.EFF(278,"table()"),e.k0s(),e.EFF(279,") function.\n"),e.k0s(),e.j41(280,"p"),e.EFF(281,"You can watch this video to see the "),e.j41(282,"strong"),e.EFF(283,"Interactive Playground"),e.k0s(),e.EFF(284," feature in action:"),e.k0s(),e.j41(285,"figure"),e.nrm(286,"iframe",25),e.k0s(),e.j41(287,"h4",26)(288,"span"),e.EFF(289,"Bootstrap performance analyzer"),e.k0s()(),e.j41(290,"p"),e.EFF(291,"To see a list of all class nodes (controllers, providers, enhancers, etc.) and their corresponding instantiation times, navigate to the "),e.j41(292,"strong"),e.EFF(293,"Bootstrap performance"),e.k0s(),e.EFF(294," page:"),e.k0s(),e.j41(295,"figure"),e.nrm(296,"img",27),e.k0s(),e.j41(297,"p"),e.EFF(298,"This page is particularly useful when you want to identify the slowest parts of your application's bootstrap process (e.g. when you want to optimize the application's startup time which is crucial for, for example, serverless environments)."),e.k0s(),e.j41(299,"h4",28)(300,"span"),e.EFF(301,"Audit"),e.k0s()(),e.j41(302,"p"),e.EFF(303,"To see the auto-generated audit - errors/warnings/hints that the application came up with while analyzing your serialized graph, navigate to the "),e.j41(304,"strong"),e.EFF(305,"Audit"),e.k0s(),e.EFF(306," page:"),e.k0s(),e.j41(307,"figure"),e.nrm(308,"img",29),e.k0s(),e.j41(309,"blockquote",6)(310,"strong"),e.EFF(311,"Hint"),e.k0s(),e.EFF(312," The screenshot above doesn't show all of the available audit rules.\n"),e.k0s(),e.j41(313,"p"),e.EFF(314,"This page comes in handy when you want to identify potential issues in your application."),e.k0s(),e.j41(315,"h4",30)(316,"span"),e.EFF(317,"Preview static files"),e.k0s()(),e.j41(318,"p"),e.EFF(319,"To save a serialized graph to a file, use the following code:"),e.k0s(),e.j41(320,"app-copy-button")(321,"pre")(322,"code",8),e.EFF(323,"\nawait app.listen(process.env.PORT ?? 3000); // OR await app.init()\nfs.writeFileSync('./graph.json', app.get(SerializedGraph).toString());\n"),e.k0s()()(),e.j41(324,"blockquote",6)(325,"strong"),e.EFF(326,"Hint"),e.k0s(),e.j41(327,"code"),e.EFF(328,"SerializedGraph"),e.k0s(),e.EFF(329," is exported from the "),e.j41(330,"code"),e.EFF(331,"@nestjs/core"),e.k0s(),e.EFF(332," package.\n"),e.k0s(),e.j41(333,"p"),e.EFF(334,"Then you can drag and drop/upload this file:"),e.k0s(),e.j41(335,"figure"),e.nrm(336,"img",17),e.k0s(),e.j41(337,"p"),e.EFF(338,"This is helpful when you want to share your graph with someone else (e.g., co-worker), or when you want to analyze it offline."),e.k0s()())},dependencies:[p.a,c.z],encapsulation:2,changeDetection:0})}return t})(),data:{title:"Devtools - Overview"}},{path:"ci-cd-integration",component:(()=>{class t extends l.y{static \u0275fac=(()=>{let o;return function(r){return(o||(o=e.xGo(t)))(r||t)}})();static \u0275cmp=e.VBU({type:t,selectors:[["app-devtools-ci-cd"]],features:[e.Vt3],decls:288,vars:12,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/devtools/ci-cd.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","cicd-integration"],[1,"info"],["rel","nofollow","target","_blank","href","https://devtools.nestjs.com"],["routerLink","/settings"],["width","1000","height","565","src",e.wXG`https://www.youtube.com/embed/r5RXcBrnEQ8`,"title","YouTube video player","frameBorder","0","allow","accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share","allowFullScreen",""],["appAnchor","","id","publishing-graphs"],[1,"language-typescript"],["src","/assets/devtools/graph-published-terminal.png"],["src","/assets/devtools/project.png"],["appAnchor","","id","reports"],["src","/assets/devtools/report.png"],["appAnchor","","id","build-preview"],["src","/assets/devtools/nodes-selection.png"],["appAnchor","","id","integrations-github-actions"],[1,"language-yaml"],["rel","nofollow","target","_blank","href","https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository"],["rel","nofollow","target","_blank","href","https://devtools.nestjs.com/settings/manage-api-keys"],["src","/assets/devtools/integrate-github-app.png"],["src","/assets/devtools/actions-preview.png"],["appAnchor","","id","integrations-gitlab-pipelines"],["appAnchor","","id","other-cicd-tools"],["rel","nofollow","target","_blank","href","https://bitbucket.org/product/features/pipelines"],["rel","nofollow","target","_blank","href","https://circleci.com/"],["rel","nofollow","target","_blank","href","https://circleci.com/docs/variables/#built-in-environment-variables"],["rel","nofollow","target","_blank","href","https://support.atlassian.com/bitbucket-cloud/docs/variables-and-secrets/"]],template:function(n,r){1&n&&(e.j41(0,"div",1,0)(2,"div",2)(3,"a",3),e.nrm(4,"i",4),e.k0s()(),e.j41(5,"h3",5),e.EFF(6,"CI/CD integration"),e.k0s(),e.j41(7,"blockquote",6)(8,"strong"),e.EFF(9,"Hint"),e.k0s(),e.EFF(10," This chapter covers the Nest Devtools integration with the Nest framework. If you are looking for the Devtools application, please visit the "),e.j41(11,"a",7),e.EFF(12,"Devtools"),e.k0s(),e.EFF(13," website.\n"),e.k0s(),e.j41(14,"p"),e.EFF(15,"CI/CD integration is available for users with the "),e.j41(16,"strong")(17,"a",8),e.EFF(18,"Enterprise"),e.k0s()(),e.EFF(19," plan."),e.k0s(),e.j41(20,"p"),e.EFF(21,"You can watch this video to learn why & how CI/CD integration can help you:"),e.k0s(),e.j41(22,"figure"),e.nrm(23,"iframe",9),e.k0s(),e.j41(24,"h4",10)(25,"span"),e.EFF(26,"Publishing graphs"),e.k0s()(),e.j41(27,"p"),e.EFF(28,"Let's first configure the application bootstrap file ("),e.j41(29,"code"),e.EFF(30,"main.ts"),e.k0s(),e.EFF(31,") to use the "),e.j41(32,"code"),e.EFF(33,"GraphPublisher"),e.k0s(),e.EFF(34," class (exported from the "),e.j41(35,"code"),e.EFF(36,"@nestjs/devtools-integration"),e.k0s(),e.EFF(37," - see previous chapter for more details), as follows:"),e.k0s(),e.j41(38,"app-copy-button")(39,"pre")(40,"code",11),e.EFF(41,'\nasync function bootstrap() {\n  const shouldPublishGraph = process.env.PUBLISH_GRAPH === "true";\n\n  const app = await NestFactory.create(AppModule, {\n    snapshot: true,\n    preview: shouldPublishGraph,\n  });\n\n  if (shouldPublishGraph) {\n    await app.init();\n\n    const publishOptions = { ... } // NOTE: this options object will vary depending on the CI/CD provider you\'re using\n    const graphPublisher = new GraphPublisher(app);\n    await graphPublisher.publish(publishOptions);\n\n    await app.close();\n  } else {\n    await app.listen(process.env.PORT ?? 3000);\n  }\n}\n'),e.k0s()()(),e.j41(42,"p"),e.EFF(43,"As we can see, we're using the "),e.j41(44,"code"),e.EFF(45,"GraphPublisher"),e.k0s(),e.EFF(46," here to publish our serialized graph to the centralized registry. The "),e.j41(47,"code"),e.EFF(48,"PUBLISH_GRAPH"),e.k0s(),e.EFF(49," is a custom environment variable that will let us control whether the graph should be published (CI/CD workflow), or not (regular application bootstrap). Also, we set the "),e.j41(50,"code"),e.EFF(51,"preview"),e.k0s(),e.EFF(52," attribute here to "),e.j41(53,"code"),e.EFF(54,"true"),e.k0s(),e.EFF(55,". With this flag enabled, our application will bootstrap in the preview mode - which basically means that constructors (and lifecycle hooks) of all controllers, enhancers, and providers in our application will not be executed. Note - this isn't "),e.j41(56,"strong"),e.EFF(57,"required"),e.k0s(),e.EFF(58,", but makes things simpler for us since in this case we won't really have to connect to the database etc. when running our application in the CI/CD pipeline."),e.k0s(),e.j41(59,"p"),e.EFF(60,"The "),e.j41(61,"code"),e.EFF(62,"publishOptions"),e.k0s(),e.EFF(63," object will vary depending on the CI/CD provider you're using. We will provide you with instructions for the most popular CI/CD providers below, in later sections."),e.k0s(),e.j41(64,"p"),e.EFF(65,"Once the graph is successfully published, you'll see the following output in your workflow view:"),e.k0s(),e.j41(66,"figure"),e.nrm(67,"img",12),e.k0s(),e.j41(68,"p"),e.EFF(69,"Every time our graph is published, we should see a new entry in the project's corresponding page:"),e.k0s(),e.j41(70,"figure"),e.nrm(71,"img",13),e.k0s(),e.j41(72,"h4",14)(73,"span"),e.EFF(74,"Reports"),e.k0s()(),e.j41(75,"p"),e.EFF(76,"Devtools generate a report for every build "),e.j41(77,"strong"),e.EFF(78,"IF"),e.k0s(),e.EFF(79," there's a corresponding snapshot already stored in the centralized registry. So for example, if you create a PR against the "),e.j41(80,"code"),e.EFF(81,"master"),e.k0s(),e.EFF(82," branch for which the graph was already published - then the application will be able to detect differences and generate a report. Otherwise, the report will not be generated."),e.k0s(),e.j41(83,"p"),e.EFF(84,"To see reports, navigate to the project's corresponding page (see organizations)."),e.k0s(),e.j41(85,"figure"),e.nrm(86,"img",15),e.k0s(),e.j41(87,"p"),e.EFF(88,"This is particularly helpful in identifying changes that may have gone unnoticed during code reviews. For instance, let's say someone has changed the scope of a "),e.j41(89,"strong"),e.EFF(90,"deeply nested provider"),e.k0s(),e.EFF(91,". This change might not be immediately obvious to the reviewer, but with Devtools, we can easily spot such changes and make sure that they're intentional. Or if we remove a guard from a specific endpoint, it will show up as affected in the report. Now if we didn't have integration or e2e tests for that route, we might not notice that it's no longer protected, and by the time we do, it could be too late."),e.k0s(),e.j41(92,"p"),e.EFF(93,"Similarly, if we're working on a "),e.j41(94,"strong"),e.EFF(95,"large codebase"),e.k0s(),e.EFF(96," and we modify a module to be global, we'll see how many edges were added to the graph, and this - in most cases - is a sign that we're doing something wrong."),e.k0s(),e.j41(97,"h4",16)(98,"span"),e.EFF(99,"Build preview"),e.k0s()(),e.j41(100,"p"),e.EFF(101,"For every published graph we can go back in time and preview how it looked before by clicking at the "),e.j41(102,"strong"),e.EFF(103,"Preview"),e.k0s(),e.EFF(104," button. Furthermore, if the report was generated, we should see the differences highlighted on our graph:"),e.k0s(),e.j41(105,"ul")(106,"li"),e.EFF(107,"green nodes represent added elements"),e.k0s(),e.j41(108,"li"),e.EFF(109,"light white nodes represent updated elements"),e.k0s(),e.j41(110,"li"),e.EFF(111,"red nodes represent deleted elements"),e.k0s()(),e.j41(112,"p"),e.EFF(113,"See screenshot below:"),e.k0s(),e.j41(114,"figure"),e.nrm(115,"img",17),e.k0s(),e.j41(116,"p"),e.EFF(117,"The ability to go back in time lets you investigate and troubleshoot the issue by comparing the current graph with the previous one. Depending on how you set things up, every pull request (or even every commit) will have a corresponding snapshot in the registry, so you can easily go back in time and see what changed. Think of Devtools as a Git but with an understanding of how Nest constructs your application graph, and with the ability to "),e.j41(118,"strong"),e.EFF(119,"visualize"),e.k0s(),e.EFF(120," it."),e.k0s(),e.j41(121,"h4",18)(122,"span"),e.EFF(123,"Integrations: GitHub Actions"),e.k0s()(),e.j41(124,"p"),e.EFF(125,"First let's start from creating a new GitHub workflow in the "),e.j41(126,"code"),e.EFF(127,".github/workflows"),e.k0s(),e.EFF(128," directory in our project and call it, for example, "),e.j41(129,"code"),e.EFF(130,"publish-graph.yml"),e.k0s(),e.EFF(131,". Inside this file, let's use the following definition:"),e.k0s(),e.j41(132,"pre")(133,"code",19),e.EFF(134),e.k0s()(),e.j41(135,"p"),e.EFF(136,"Ideally, "),e.j41(137,"code"),e.EFF(138,"DEVTOOLS_API_KEY"),e.k0s(),e.EFF(139," environment variable should be retrieved from GitHub Secrets, read more "),e.j41(140,"a",20),e.EFF(141,"here"),e.k0s(),e.EFF(142," ."),e.k0s(),e.j41(143,"p"),e.EFF(144,"This workflow will run per each pull request that's targeting the "),e.j41(145,"code"),e.EFF(146,"master"),e.k0s(),e.EFF(147," branch OR in case there's a direct commit to the "),e.j41(148,"code"),e.EFF(149,"master"),e.k0s(),e.EFF(150," branch. Feel free to align this configuration to whatever your project needs. What's essential here is that we provide necessary environment variables for our "),e.j41(151,"code"),e.EFF(152,"GraphPublisher"),e.k0s(),e.EFF(153," class (to run)."),e.k0s(),e.j41(154,"p"),e.EFF(155,"However, there's one variable that needs to be updated before we can start using this workflow - "),e.j41(156,"code"),e.EFF(157,"DEVTOOLS_API_KEY"),e.k0s(),e.EFF(158,". We can generate an API key dedicated for our project on this "),e.j41(159,"a",21),e.EFF(160,"page"),e.k0s(),e.EFF(161,"."),e.k0s(),e.j41(162,"p"),e.EFF(163,"Lastly, let's navigate to the "),e.j41(164,"code"),e.EFF(165,"main.ts"),e.k0s(),e.EFF(166," file again and update the "),e.j41(167,"code"),e.EFF(168,"publishOptions"),e.k0s(),e.EFF(169," object we previously left empty."),e.k0s(),e.j41(170,"app-copy-button")(171,"pre")(172,"code",11),e.EFF(173,"\nconst publishOptions = {\n  apiKey: process.env.DEVTOOLS_API_KEY,\n  repository: process.env.REPOSITORY_NAME,\n  owner: process.env.GITHUB_REPOSITORY_OWNER,\n  sha: process.env.COMMIT_SHA,\n  target: process.env.TARGET_SHA,\n  trigger: process.env.GITHUB_BASE_REF ? 'pull' : 'push',\n  branch: process.env.BRANCH_NAME,\n};\n"),e.k0s()()(),e.j41(174,"p"),e.EFF(175,"For the best developer experience, make sure to integrate the "),e.j41(176,"strong"),e.EFF(177,"GitHub application"),e.k0s(),e.EFF(178,' for your project by clicking on the "Integrate GitHub app" button (see screenshot below). Note - this isn\'t required.'),e.k0s(),e.j41(179,"figure"),e.nrm(180,"img",22),e.k0s(),e.j41(181,"p"),e.EFF(182,"With this integration, you'll be able to see the status of the preview/report generation process right in your pull request:"),e.k0s(),e.j41(183,"figure"),e.nrm(184,"img",23),e.k0s(),e.j41(185,"h4",24)(186,"span"),e.EFF(187,"Integrations: Gitlab Pipelines"),e.k0s()(),e.j41(188,"p"),e.EFF(189,"First let's start from creating a new Gitlab CI configuration file in the root directory of our project and call it, for example, "),e.j41(190,"code"),e.EFF(191,".gitlab-ci.yml"),e.k0s(),e.EFF(192,". Inside this file, let's use the following definition:"),e.k0s(),e.j41(193,"app-copy-button")(194,"pre")(195,"code",11),e.EFF(196,"\nconst publishOptions = {\n  apiKey: process.env.DEVTOOLS_API_KEY,\n  repository: process.env.REPOSITORY_NAME,\n  owner: process.env.GITHUB_REPOSITORY_OWNER,\n  sha: process.env.COMMIT_SHA,\n  target: process.env.TARGET_SHA,\n  trigger: process.env.GITHUB_BASE_REF ? 'pull' : 'push',\n  branch: process.env.BRANCH_NAME,\n};\n"),e.k0s()()(),e.j41(197,"blockquote",6)(198,"strong"),e.EFF(199,"Hint"),e.k0s(),e.EFF(200," Ideally, "),e.j41(201,"code"),e.EFF(202,"DEVTOOLS_API_KEY"),e.k0s(),e.EFF(203," environment variable should be retrieved from secrets.\n"),e.k0s(),e.j41(204,"p"),e.EFF(205,"This workflow will run per each pull request that's targeting the "),e.j41(206,"code"),e.EFF(207,"master"),e.k0s(),e.EFF(208," branch OR in case there's a direct commit to the "),e.j41(209,"code"),e.EFF(210,"master"),e.k0s(),e.EFF(211," branch. Feel free to align this configuration to whatever your project needs. What's essential here is that we provide necessary environment variables for our "),e.j41(212,"code"),e.EFF(213,"GraphPublisher"),e.k0s(),e.EFF(214," class (to run)."),e.k0s(),e.j41(215,"p"),e.EFF(216,"However, there's one variable (in this workflow definition) that needs to be updated before we can start using this workflow - "),e.j41(217,"code"),e.EFF(218,"DEVTOOLS_API_KEY"),e.k0s(),e.EFF(219,". We can generate an API key dedicated for our project on this "),e.j41(220,"strong"),e.EFF(221,"page"),e.k0s(),e.EFF(222," ."),e.k0s(),e.j41(223,"p"),e.EFF(224,"Lastly, let's navigate to the "),e.j41(225,"code"),e.EFF(226,"main.ts"),e.k0s(),e.EFF(227," file again and update the "),e.j41(228,"code"),e.EFF(229,"publishOptions"),e.k0s(),e.EFF(230," object we previously left empty."),e.k0s(),e.j41(231,"pre")(232,"code",19),e.EFF(233,'\nimage: node:16\n\nstages:\n  - build\n\ncache:\n  key:\n    files:\n      - package-lock.json\n  paths:\n    - node_modules/\n\nworkflow:\n  rules:\n    - if: $CI_PIPELINE_SOURCE == "merge_request_event"\n      when: always\n    - if: $CI_COMMIT_BRANCH == "master" && $CI_PIPELINE_SOURCE == "push"\n      when: always\n    - when: never\n\ninstall_dependencies:\n  stage: build\n  script:\n    - npm ci\n\npublish_graph:\n  stage: build\n  needs:\n    - install_dependencies\n  script: npm run start\n  variables:\n    PUBLISH_GRAPH: \'true\'\n    DEVTOOLS_API_KEY: \'CHANGE_THIS_TO_YOUR_API_KEY\'\n'),e.k0s()(),e.j41(234,"h4",25)(235,"span"),e.EFF(236,"Other CI/CD tools"),e.k0s()(),e.j41(237,"p"),e.EFF(238,"Nest Devtools CI/CD integration can be used with any CI/CD tool of your choice (e.g., "),e.j41(239,"a",26),e.EFF(240,"Bitbucket Pipelines"),e.k0s(),e.EFF(241," , "),e.j41(242,"a",27),e.EFF(243,"CircleCI"),e.k0s(),e.EFF(244,", etc) so don't feel limited to providers we described here."),e.k0s(),e.j41(245,"p"),e.EFF(246,"Look at the following "),e.j41(247,"code"),e.EFF(248,"publishOptions"),e.k0s(),e.EFF(249," object configuration to understand what information is required to publish the graph for a given commit/build/PR."),e.k0s(),e.j41(250,"app-copy-button")(251,"pre")(252,"code",11),e.EFF(253,"\nconst publishOptions = {\n  apiKey: process.env.DEVTOOLS_API_KEY,\n  repository: process.env.CI_PROJECT_NAME,\n  owner: process.env.CI_PROJECT_ROOT_NAMESPACE,\n  sha: process.env.CI_COMMIT_SHA,\n  target: process.env.CI_MERGE_REQUEST_DIFF_BASE_SHA,\n  trigger: process.env.CI_MERGE_REQUEST_DIFF_BASE_SHA ? 'pull' : 'push',\n  branch: process.env.CI_COMMIT_BRANCH ?? process.env.CI_MERGE_REQUEST_SOURCE_BRANCH_NAME,\n};\n"),e.k0s()()(),e.j41(254,"p"),e.EFF(255,"Most of this information is provided through CI/CD built-in environment variables (see "),e.j41(256,"a",28),e.EFF(257,"CircleCI built-in environment list"),e.k0s(),e.EFF(258," and "),e.j41(259,"a",29),e.EFF(260,"Bitbucket variables"),e.k0s(),e.EFF(261," )."),e.k0s(),e.j41(262,"p"),e.EFF(263,"When it comes to the pipeline configuration for publishing graphs, we recommend using the following triggers:"),e.k0s(),e.j41(264,"ul")(265,"li")(266,"code"),e.EFF(267,"push"),e.k0s(),e.EFF(268," event - only if the current branch represents a deployment environment, for example "),e.j41(269,"code"),e.EFF(270,"master"),e.k0s(),e.EFF(271,", "),e.j41(272,"code"),e.EFF(273,"main"),e.k0s(),e.EFF(274,", "),e.j41(275,"code"),e.EFF(276,"staging"),e.k0s(),e.EFF(277,", "),e.j41(278,"code"),e.EFF(279,"production"),e.k0s(),e.EFF(280,", etc."),e.k0s(),e.j41(281,"li")(282,"code"),e.EFF(283,"pull request"),e.k0s(),e.EFF(284," event - always, or when the "),e.j41(285,"strong"),e.EFF(286,"target branch"),e.k0s(),e.EFF(287," represents a deployment environment (see above)"),e.k0s()()()),2&n&&(e.R7$(134),e.xRd(["\nname: Devtools\n\non:\n  push:\n    branches:\n      - master\n  pull_request:\n    branches:\n      - '*'\n\njobs:\n  publish:\n    if: github.actor!= 'dependabot[bot]'\n    name: Publish graph\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v3\n      - uses: actions/setup-node@v3\n        with:\n          node-version: '16'\n          cache: 'npm'\n      - name: Install dependencies\n        run: npm ci\n      - name: Setup Environment (PR)\n        if: ","${{"," github.event_name == 'pull_request' ","}}",'\n        shell: bash\n        run: |\n          echo "COMMIT_SHA=',"${{"," github.event.pull_request.head.sha ","}}",'" >>\\${GITHUB_ENV}\n      - name: Setup Environment (Push)\n        if: ',"${{"," github.event_name == 'push' ","}}",'\n        shell: bash\n        run: |\n          echo "COMMIT_SHA=\\${GITHUB_SHA}" >> \\${GITHUB_ENV}\n      - name: Publish\n        run: PUBLISH_GRAPH=true npm run start\n        env:\n          DEVTOOLS_API_KEY: CHANGE_THIS_TO_YOUR_API_KEY\n          REPOSITORY_NAME: ',"${{"," github.event.repository.name ","}}","\n          BRANCH_NAME: ","${{"," github.head_ref || github.ref_name ","}}","\n          TARGET_SHA: ","${{"," github.event.pull_request.base.sha ","}}","\n"]))},dependencies:[p.a,c.z,a.Wk],encapsulation:2,changeDetection:0})}return t})(),data:{title:"Devtools - CI/CD integration"}}];let u=(()=>{class t{static \u0275fac=function(n){return new(n||t)};static \u0275mod=e.$C({type:t});static \u0275inj=e.G2t({imports:[F.MD,h.G,a.iI.forChild(d)]})}return t})()}}]);