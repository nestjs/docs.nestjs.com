<div class="content">
  <h3>SQL (TypeORM)</h3>
  <h5>This chapter applies only to TypeScript</h5>
  <p>
    <a href="https://github.com/typeorm/typeorm" target="blank">TypeORM</a> is definitely the most mature Object Relational Mapper (ORM) available in the node.js world.
    Since it's written in TypeScript, it works pretty well with the Nest framework.
    To start the adventure with this library we have to install all of the required dependencies:
  </p>
  <pre><code class="language-typescript">{{ dependencies }}</code></pre>
  <p>
    The first step we need to do is to establish the connection with our database using <code>createConnection()</code> function imported from the <code>typeorm</code> package.
    The <code>createConnection()</code> function returns the <code>Promise</code>, so it's necessary to create an <a routerLink="/advanced/async-components">async component</a>.
  </p>
  <span class="filename">database.providers.ts</span>
  <pre><code class="language-typescript">{{ databaseProviders }}</code></pre>
  <blockquote class="warning">
      <strong>Hint</strong> Following best practices, we've declared the custom component in the separated file which has a <code>*.providers.ts</code> suffix.
   </blockquote>
   <p>
     Then we need to export these providers to make them <strong>accessible</strong> for the rest part of the application.
  </p>
  <span class="filename">database.module.ts</span>
  <pre><code class="language-typescript">{{ databaseModule }}</code></pre>
  <p>
    It's everything. Now we can inject the <code>Connection</code> object using <code>@Inject()</code> decorator.
    Each component which would depend on the <code>Connection</code> async component will wait until the <code>Promise</code> would be resolved.
  </p>
  <h4>Repository pattern</h4>
  <p>
    The <a href="https://github.com/typeorm/typeorm" target="blank">TypeORM</a> supports the repository design pattern, so each entity has its own Repository. These repositories can be obtained from the database connection.
  </p>
  <p>
    Firstly, we need at least one entity. We're gonna reuse the <code>Photo</code> entity from the offical documentation.
  </p>
  <span class="filename">photo/photo.entity.ts</span>
  <pre><code class="language-typescript">{{ photoEntity }}</code></pre>
  <p>
    The <code>Photo</code> entity belongs to the <code>photo</code> directory.
    This directory represents the <code>PhotoModule</code>. It's your decision where you gonna keep your model files. From my point of view, the best way's to hold them nearly their <strong>domain</strong>, in the appropriate module directory.
  </p>
  <p>
    Let's create a <strong>Repository</strong> component:
  </p>
  <span class="filename">photo.providers.ts</span>
  <pre><code class="language-typescript">{{ photoProviders }}</code></pre>
  <blockquote>
      <strong>Notice</strong> In the real-world applications you should avoid <strong>magic strings</strong> at all. Both <code>PhotoRepositoryToken</code> and <code>DbConnectionToken</code> should be kept in the separated <code>constants.ts</code> file. 
   </blockquote>
   <p>
     Now we can inject the <code>PhotoRepository</code> to the <code>PhotoService</code> using the <code>@Inject()</code> decorator:
   </p>
   <span class="filename">photo.service.ts</span>
  <pre><code class="language-typescript">{{ photoService }}</code></pre>
  <p>
    The database connection's <strong>asynchronous</strong>, but Nest makes this process's completely invisible for the end-user.
    The <code>PhotoRepository</code> component's waiting for the db connection, and the <code>PhotoService</code> is delayed until repository would be ready to use.
    The entire application can start when each component is instantiated.
  </p>
  <p>
    Here's a final <code>PhotoModule</code>:
  </p>
  <span class="filename">photo.module.ts</span>
  <pre><code class="language-typescript">{{ photoModule }}</code></pre>
  <blockquote class="warning">
      <strong>Hint</strong> Don't forget to import the <code>PhotoModule</code> into the root <code>ApplicationModule</code>.
   </blockquote>
   <p>
     The full source code's available <a href="https://github.com/nestjs/nest/tree/master/examples/05-sql-typeorm" target="blank">here</a>.
   </p>
</div>