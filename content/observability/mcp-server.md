### MCP server

NestJS Observe exposes an [MCP](https://modelcontextprotocol.io/) server, so an MCP-compatible client (Claude Code, Claude Desktop, Cursor, VS Code, or an agent you wrote yourself) can query your projects directly instead of you copying dashboard data into a prompt. Regressions, slow operations, error groups, traces, jobs, and alerts are available: the same data the dashboard shows, scoped to exactly what you can see.

> info **Hint** MCP is one of two ways to get telemetry to an agent. The **Copy agent prompt** button (see [Dashboard](/observability/dashboard#handing-a-failure-to-a-coding-agent)) packages one page as text for a single paste. MCP is for an agent that needs to keep asking questions (follow a trace, check whether the error is still firing) without you relaying each answer.

The endpoint speaks Streamable HTTP at `POST https://<api-host>/mcp`. It's stateless: there's no session to open, nothing to keep alive, and no setup beyond the request itself. The exact host is shown next to your tokens in the dashboard.

#### Getting a token

Personal MCP tokens are minted in the dashboard under **MCP tokens**.

- Click **Create token**, give it a name, and optionally set an expiry. A token with no expiry never expires, because MCP clients have no refresh flow.
- The secret (`omcp_...`) is shown **once**, in the response to creating it. Copy it immediately; only its hash is stored, so it cannot be retrieved again. If you lose it, revoke the token and mint another.
- Tokens act **as the user who created them**, with their exact project permissions. There is nothing to scope: if you can see it in the dashboard, the token can read it over MCP, and if you can't, neither can the token.

Revoking a token from the same page cuts it off immediately. Token management itself is deliberately dashboard-only: an MCP token cannot mint or revoke MCP tokens, so a leaked credential can't extend its own life.

#### Connecting a client

Any client that speaks Streamable HTTP can connect with one URL and one header, and no OAuth flow. Clients differ only in where the config file lives and what its keys are called.

**Claude Code**

```bash
$ claude mcp add observe --transport http https://<api-host>/mcp --header "Authorization: Bearer <token>"
```

**Claude Desktop, and other `mcpServers` clients**

```json
{
  "mcpServers": {
    "observe": {
      "url": "https://<api-host>/mcp",
      "headers": { "Authorization": "Bearer <token>" }
    }
  }
}
```

**Cursor** uses the same `mcpServers` shape in `~/.cursor/mcp.json` (every project) or `.cursor/mcp.json` (one project), and expands `${{ '{' }}env:...{{ '}' }}` inside `url` and `headers`, which is how you keep the token out of a file you might commit:

```json
{
  "mcpServers": {
    "observe": {
      "url": "https://<api-host>/mcp",
      "headers": { "Authorization": "Bearer ${env:OBSERVE_MCP_TOKEN}" }
    }
  }
}
```

**VS Code (Copilot agent mode)** uses `servers` rather than `mcpServers`, wants an explicit `type`, and can prompt for the token once and store it encrypted. In `.vscode/mcp.json` for one workspace, or your user `mcp.json` for all of them:

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "observe-token",
      "description": "NestJS Observe MCP token",
      "password": true
    }
  ],
  "servers": {
    "observe": {
      "type": "http",
      "url": "https://<api-host>/mcp",
      "headers": { "Authorization": "Bearer ${input:observe-token}" }
    }
  }
}
```

**Your own agent.** With the official TypeScript SDK, the endpoint is a `StreamableHTTPClientTransport` and the token goes in `requestInit.headers`:

```typescript
const client = new Client({ name: 'my-agent', version: '1.0.0' });

await client.connect(
  new StreamableHTTPClientTransport(new URL('https://<api-host>/mcp'), {
    requestInit: {
      headers: { Authorization: `Bearer ${process.env.OBSERVE_MCP_TOKEN}` },
    },
  }),
);

const { tools } = await client.listTools();
```

Before debugging a client's config, confirm that the endpoint and token work. This command lists the tools the server advertises:

```bash
$ curl -s https://<api-host>/mcp \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

If you get a tool list back, the credential is valid and anything still broken is client-side. A **401** means the token is missing, expired, or revoked, or the header is malformed. A **405** means the client sent `GET` or `DELETE`; every MCP request to this endpoint must be a `POST`.

#### An example investigation

The tools are shaped around investigations rather than endpoints, so each answer carries the key the next question needs. Suppose a deploy went out and something seems wrong:

1. **"What regressed after the last deploy?"** - `find_regressions` compares error rate and latency either side of each release boundary (your `serviceVersion` values) and names the release that made things worse, along with the operations it degraded.
2. **"Show me that operation."** - `get_operation_details` returns the route's latency and error summary plus recent individual requests, each with a `traceId`.
3. **"What did that request actually do?"** - `get_trace` resolves the trace id into the waterfall: every execution under it, across services, with span trees.
4. **"What did the code say while it happened?"** - `get_trace_logs` returns every log line emitted under the same trace id, in order.

Errors and background jobs follow the same shape: `list_error_groups` → `get_error_details` → `get_trace`, and `list_jobs` → `get_job_details` → `get_trace`. In every case, start with `list_projects`, since almost every diagnostic tool takes a `projectId`.

#### Available tools

Almost every tool is read-only; the ones that write are listed under [Setting up a service](/observability/mcp-server#setting-up-a-service). Most diagnostic tools share a scope: a required `projectId`, an optional `applicationId` to narrow to one service, and an optional `timeInterval` look-back window (`1h`, `3h`, `12h`, `1d`, `3d`, `7d`, `30d`), defaulting to `1d`.

| Tool                     | What it answers                                                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `list_projects`          | Every project you're a member of, with team and application counts. Start here to resolve project ids.                                            |
| `get_project`            | One project by id, including your access level and subscription state.                                                                            |
| `search`                 | Full-text search over your projects, applications, alert rules, SLOs, and issues.                                                                 |
| `find_regressions`       | Releases that made things worse: error rate and latency before vs. after each release boundary, with the specific operations each one degraded.    |
| `list_slow_operations`   | The slowest HTTP operations in the window, ranked by p95, with volume alongside, so effort goes to what's slow _and_ hot.                          |
| `get_operation_details`  | One route: latency and error summary plus recent individual requests, each with duration, status, and `traceId`.                                  |
| `get_trace`              | A `traceId` resolved to every execution that ran under it - across services, requests, and jobs - each with its span tree.                        |
| `get_trace_logs`         | Every log line emitted under a `traceId`, in order.                                                                                               |
| `list_error_groups`      | Errors grouped by fingerprint, ranked by occurrence count, with class, sample message and stack trace, first/last seen, and the introducing release. |
| `get_error_details`      | Recent occurrences of one error class: per-occurrence message, status, user, and `traceId`, plus a summary.                                       |
| `get_error_trend`        | Whether errors are growing or decaying over the window, already classified as a direction.                                                        |
| `get_affected_users`     | The blast radius of one error class: which end users hit it and how often.                                                                        |
| `list_jobs`              | Background job performance in the window, per job name and queue: volume, duration, and failure counts.                                           |
| `get_job_details`        | One job name on one queue: duration and wait-time summaries plus recent individual executions, each with status and `traceId`.                    |
| `list_issues`, `get_issue` | Issues across your projects, and one issue with its comments and activity.                                                                      |
| `list_slos`              | A project's SLOs with current status and error-budget burn.                                                                                       |
| `list_alert_rules`, `list_alert_events` | Alert rules across every project you can see, and their firing history.                                                            |

Apart from setting up a service and resolving an issue, nothing can be created or changed through MCP, including alert rules and error-group status. Those stay in the dashboard. Tool results also omit the time-bucketed chart series the dashboard endpoints return, because hundreds of bucket values cost context and say less than the summary derived from them.

#### Setting up a service

These are the tools that write. Each goes through the same service as the matching dashboard button, so your role on the project and your plan's limits apply exactly as they do there, and a refusal comes back as the tool's answer. Nothing can be deleted, renamed, or revoked over MCP.

| Tool                 | What it does |
| -------------------- | ------------ |
| `list_applications`  | The applications of one project. Check it before creating a duplicate. |
| `create_project`     | Creates a project, in an existing team (pass its id) or a new one named after the project. |
| `create_application` | Registers one NestJS service in a project. The name can't be changed over MCP and should match the `serviceId` you give the SDK. |
| `create_api_key`     | Issues the key pair the SDK authenticates with. The secret is returned once; a well-behaved client writes it to your git-ignored environment file and does not repeat it. |
| `resolve_issue`      | Marks an issue resolved after a fix ships, which starts verification against the pre-incident baseline. |

With these tools, an agent can take a repository from "not instrumented" to "reporting" in one request: *"Set up NestJS Observe for this service"* becomes `list_projects` → `create_application` → `create_api_key`, followed by the install and the three code edits from the [SDK guide](/observability/sdk).
